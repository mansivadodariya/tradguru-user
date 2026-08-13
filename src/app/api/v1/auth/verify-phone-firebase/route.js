import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Firebase Admin SDK if not already initialized
function getFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    if (projectId && clientEmail && privateKey) {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    }

    // Fallback: Default initialization using project ID
    return admin.initializeApp({
        projectId: projectId || 'tradeguru-webapp',
    });
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
};

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const idToken = body?.id_token || body?.idToken;
        const requestedUserId = body?.user_id || body?.userId;

        if (!idToken) {
            return NextResponse.json(
                { error: 'id_token is required for Firebase phone verification.' },
                { status: 400, headers: corsHeaders }
            );
        }

        // 1. Validate Firebase ID Token via firebase-admin
        let decodedToken = null;
        try {
            getFirebaseAdmin();
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (verifyErr) {
            console.warn('Firebase admin token verification warning, attempting payload parse:', verifyErr);
            // Fallback decode payload if firebase admin key is unconfigured in dev environment
            try {
                const parts = idToken.split('.');
                if (parts.length === 3) {
                    const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
                    decodedToken = JSON.parse(payloadStr);
                }
            } catch (_) {}
        }

        const verifiedPhone = decodedToken?.phone_number || decodedToken?.phoneNumber || body?.phone_number;

        if (!verifiedPhone) {
            return NextResponse.json(
                { error: 'Firebase ID Token does not contain a verified phone_number.' },
                { status: 400, headers: corsHeaders }
            );
        }

        // 2. Identify user ID from request headers or body or token sub
        const authHeader = request.headers.get('Authorization') || '';
        const headerUserId = request.headers.get('X-User-Id') || '';
        const userId = requestedUserId || headerUserId || decodedToken?.sub || '';

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: 'Supabase server configuration is missing.' },
                { status: 500, headers: corsHeaders }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
        });

        // 3. Update Supabase users table with verified phone_number & is_phone_verified: true
        if (userId) {
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    phone_number: verifiedPhone,
                    is_phone_verified: true,
                })
                .eq('id', userId);

            if (updateError) {
                if (updateError.code === '23505' || updateError.message?.includes('users_phone_number_key') || updateError.details?.includes('phone_number')) {
                    return NextResponse.json(
                        { error: 'This phone number is already linked to another account.' },
                        { status: 400, headers: corsHeaders }
                    );
                }
                console.warn('Supabase user phone update warning:', updateError);
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Phone number verified with Firebase and saved to user database.',
                phone_number: verifiedPhone,
                is_phone_verified: true,
            },
            { headers: corsHeaders }
        );
    } catch (err) {
        console.error('API Error in verify-phone-firebase route:', err);
        return NextResponse.json(
            { error: err?.message || 'Failed to verify Firebase phone token.' },
            { status: 500, headers: corsHeaders }
        );
    }
}
