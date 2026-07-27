import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}

export async function POST(request) {
    try {
        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: 'Supabase server configuration is missing.' },
                { status: 500, headers: corsHeaders }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
        });

        const body = await request.json();
        const { userId, first_name, last_name, phone_number } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required.' },
                { status: 400, headers: corsHeaders }
            );
        }

        const updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (phone_number !== undefined) updateData.phone_number = phone_number;

        const { error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            if (error.code === '23505' || error.message?.includes('users_phone_number_key') || error.details?.includes('phone_number')) {
                return NextResponse.json(
                    { error: 'This phone number is already in use by another account.' },
                    { status: 400, headers: corsHeaders }
                );
            }
            throw error;
        }

        return NextResponse.json(
            { success: true, message: 'Profile updated successfully' },
            { headers: corsHeaders }
        );
    } catch (err) {
        console.error('API Error in profile update endpoint:', err);
        return NextResponse.json(
            { error: err?.message || 'Failed to update profile' },
            { status: 500, headers: corsHeaders }
        );
    }
}
