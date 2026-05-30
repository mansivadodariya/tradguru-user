import React from 'react'
import styles from './privacyPolicy.module.scss';

export default function PrivacyPolicy() {
    return (
        <div className={styles.privacyPolicy}>
            <div className='container-xs'>
                <div className={styles.header}>
                    <h1>Privacy Policy</h1>
                    <p>Last Updated: May 2026</p>
                </div>
                <div className={styles.content}>
                    <section>
                        <h2>Introduction</h2>
                        <p>Trade Master ("Trade Master", "we", "our", or "us") is committed to protecting your privacy and safeguarding the personal information you provide while using our platform. Trade Master provides AI-powered trading analysis, market insights, forex and cryptocurrency market information, economic calendar data, educational resources, chart analysis tools, and AI chatbot services. This Privacy Policy explains how we collect, use, process, store, and protect your information when you access or use our services. By accessing or using Trade Master, you agree to the collection and use of information in accordance with this Privacy Policy.</p>
                    </section>

                    <section>
                        <h2>Information We Collect</h2>
                        <p>We may collect personal information that you voluntarily provide when creating an account, subscribing to services, contacting support, participating in surveys, or interacting with our platform. Such information may include your name, email address, account credentials, profile information, communication preferences, and any information you choose to provide during interactions with our services.</p>
                        <p>We may also collect information related to your use of the platform, including selected currency pairs, market interests, trading preferences, watchlists, saved analyses, chart uploads, AI-generated analysis requests, chatbot conversations, historical analysis records, and platform activity. This information helps us improve service quality and provide a more personalized experience.</p>
                        <p>In addition, certain technical information may be collected automatically when you access our services, including your IP address, browser type, operating system, device information, session data, referral URLs, cookies, usage statistics, and analytics information. This information assists us in maintaining security, monitoring performance, and improving functionality.</p>
                    </section>

                    <section>
                        <h2>How We Use Your Information</h2>
                        <p>We use collected information to provide, operate, maintain, and improve our services. This includes generating AI-powered market analysis, responding to chatbot requests, delivering educational content, personalizing user experiences, maintaining account functionality, and improving platform performance.</p>
                        <p>Information may also be used to communicate important service announcements, account updates, security notifications, feature releases, educational content, promotional communications, and customer support responses. We may use information to detect, investigate, and prevent fraud, abuse, security incidents, unauthorized access, and violations of our terms.</p>
                        <p>Aggregated and anonymized information may be used for research, analytics, performance measurement, trend analysis, service optimization, and business intelligence purposes.</p>
                    </section>

                    <section>
                        <h2>AI Services and Data Processing</h2>
                        <p>Trade Master utilizes artificial intelligence and machine learning technologies to provide market insights, chart analysis, trading information, and educational content. Information submitted through AI-powered tools, including chatbot conversations and analysis requests, may be processed, stored, and analyzed to improve service quality, system accuracy, and user experience.</p>
                        <p>Although we strive to provide accurate and relevant information, AI-generated content may contain inaccuracies, incomplete information, or outdated market data. Users should independently verify all information before making financial or trading decisions.</p>
                    </section>

                    <section>
                        <h2>Data Sharing and Disclosure</h2>
                        <p>Trade Master does not sell personal information to third parties. We may share information with trusted service providers, contractors, affiliates, and technology partners who assist us in operating, securing, maintaining, and improving our services. These parties are required to protect information and use it only for authorized purposes.</p>
                        <p>Information may also be disclosed when required by law, court order, regulatory request, legal process, or governmental authority, or when necessary to protect our rights, users, property, security, or legal interests.</p>
                        <p>In connection with mergers, acquisitions, business transfers, restructurings, or asset sales, information may be transferred as part of the transaction subject to applicable legal requirements.</p>
                    </section>

                    <section>
                        <h2>Data Security</h2>
                        <p>Trade Master implements reasonable administrative, technical, and organizational safeguards designed to protect personal information from unauthorized access, disclosure, alteration, misuse, or destruction. Security measures may include encryption, access controls, authentication systems, monitoring technologies, secure infrastructure, and periodic security assessments.</p>
                        <p>While we strive to protect information using industry-standard practices, no method of electronic transmission or storage can be guaranteed to be completely secure. Users acknowledge that information transmitted over the internet may be subject to inherent security risks.</p>
                    </section>

                    <section>
                        <h2>Data Retention</h2>
                        <p>We retain personal information only for as long as necessary to fulfill the purposes described in this Privacy Policy, provide services, comply with legal obligations, resolve disputes, enforce agreements, and protect legitimate business interests.</p>
                        <p>When information is no longer required, it may be securely deleted, anonymized, aggregated, or otherwise processed in accordance with applicable laws and regulations.</p>
                    </section>

                    <section>
                        <h2>Cookies and Similar Technologies</h2>
                        <p>Trade Master uses cookies, pixels, local storage technologies, and similar tracking tools to improve functionality, remember preferences, enhance user experience, analyze usage patterns, measure performance, and provide relevant content. Users may manage cookie preferences through browser settings; however, disabling certain cookies may affect platform functionality.</p>
                    </section>

                    <section>
                        <h2>International Data Transfers</h2>
                        <p>Information collected through Trade Master may be processed, stored, and transferred to servers and service providers located in different countries. By using our services, you acknowledge and consent to such transfers where permitted by applicable law. Appropriate safeguards may be implemented to ensure the protection of personal information during international transfers.</p>
                    </section>

                    <section>
                        <h2>User Rights</h2>
                        <p>Subject to applicable laws, users may have the right to access, correct, update, restrict, delete, or request a copy of their personal information. Users may also have the right to object to certain processing activities or withdraw previously granted consent where processing is based on consent.</p>
                        <p>Requests regarding personal information may be submitted through the contact details provided below, and we will respond in accordance with applicable legal requirements.</p>
                    </section>

                    <section>
                        <h2>Children's Privacy</h2>
                        <p>Trade Master is intended solely for individuals who are at least eighteen (18) years of age. We do not knowingly collect, solicit, or process personal information from minors. If we become aware that information from a minor has been collected, we will take reasonable steps to delete such information.</p>
                    </section>

                    <section>
                        <h2>Changes to This Privacy Policy</h2>
                        <p>We reserve the right to modify, update, or revise this Privacy Policy at any time. Any changes will become effective upon publication on the platform. Continued use of Trade Master following the publication of changes constitutes acceptance of the updated Privacy Policy.</p>
                    </section>

                    <section>
                        <h2>Contact Information</h2>
                        <p>If you have any questions, concerns, requests, or complaints regarding this Privacy Policy or our privacy practices, please contact us at:</p>
                        <p><strong>Email:</strong> <a href="mailto:support@trademaster.ai">support@trademaster.ai</a></p>
                    </section>
                </div>
            </div>
        </div>
    )
}
