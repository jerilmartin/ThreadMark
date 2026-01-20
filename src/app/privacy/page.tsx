import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | infini8Graph',
    description: 'Privacy Policy for infini8Graph - Learn how we collect, use, store, and protect your information.',
};

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-6 py-16">
                {/* Header */}
                <header className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Last updated: <span className="text-gray-700 dark:text-gray-300 font-medium">20 January 2026</span>
                    </p>
                </header>

                {/* Content */}
                <article className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
                        infini8Graph (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the infini8Graph website and analytics platform (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, store, and protect your information when you use our Service.
                    </p>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-8">
                        <p className="text-blue-800 dark:text-blue-300 text-sm m-0">
                            By accessing or using infini8Graph, you agree to the practices described in this Privacy Policy.
                        </p>
                    </div>

                    {/* Section 1 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">1</span>
                            Information We Collect
                        </h2>

                        <div className="space-y-6">
                            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">1.1 Information You Provide via Instagram Login</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    When you sign in using Instagram (via Meta OAuth), we collect and store limited information necessary to provide analytics services, including:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>Instagram User ID</li>
                                    <li>Instagram username</li>
                                    <li>Account metadata required for analytics access</li>
                                </ul>
                                <p className="mt-3 text-gray-600 dark:text-gray-400 font-medium">
                                    We do not collect your Instagram password.
                                </p>
                            </div>

                            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">1.2 Access Tokens</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    To access Instagram analytics securely, we store:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>Instagram access tokens</li>
                                    <li>Token expiration timestamps</li>
                                </ul>
                                <p className="mt-3 text-gray-600 dark:text-gray-400">
                                    All access tokens are <span className="font-medium">encrypted at rest</span> using industry-standard encryption and are never exposed to the client browser.
                                </p>
                            </div>

                            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">1.3 Analytics Data</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    We temporarily process and cache analytics data such as:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>Follower counts and growth trends</li>
                                    <li>Engagement metrics (likes, comments, saves, reach, impressions)</li>
                                    <li>Post, Reel, and hashtag performance</li>
                                    <li>Derived KPIs (e.g. engagement rate, reach ratio)</li>
                                </ul>
                                <p className="mt-3 text-gray-600 dark:text-gray-400">
                                    This data is used only to generate insights for your account and is <span className="font-medium">not sold, shared, or used for advertising</span>.
                                </p>
                            </div>

                            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">1.4 Automatically Collected Information</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    When you access the website, we may collect limited technical information such as:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                    <li>Browser type and version</li>
                                    <li>Device type</li>
                                    <li>IP address (used only for security and rate limiting)</li>
                                </ul>
                                <p className="mt-3 text-gray-600 dark:text-gray-400">
                                    This data is not used to identify you personally.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">2</span>
                            How We Use Your Information
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">We use collected information to:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                            <li>Authenticate your account</li>
                            <li>Retrieve analytics from the Instagram Graph API</li>
                            <li>Generate dashboards, charts, and reports</li>
                            <li>Cache analytics to reduce API usage and improve performance</li>
                            <li>Secure the platform against abuse</li>
                            <li>Comply with legal and platform requirements</li>
                        </ul>
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium m-0">
                                We do not use your data for advertising or profiling.
                            </p>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">3</span>
                            How We Store and Protect Data
                        </h2>

                        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 mb-4">
                            <li>User data is stored in <span className="font-medium">Supabase PostgreSQL</span></li>
                            <li>Access tokens are <span className="font-medium">AES-encrypted</span></li>
                            <li>Authentication is handled using JWT stored in secure, HttpOnly cookies</li>
                            <li>All communication uses <span className="font-medium">HTTPS</span></li>
                            <li>Access to production databases is restricted and logged</li>
                        </ul>
                        <p className="text-gray-600 dark:text-gray-400">
                            We take reasonable technical and organizational measures to protect your data, but no system is 100% secure.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">4</span>
                            Data Retention
                        </h2>

                        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 mb-4">
                            <li>User account data is retained while your account remains active</li>
                            <li>Cached analytics data is stored temporarily and automatically refreshed or overwritten</li>
                            <li>Access tokens are refreshed or deleted based on expiration and account status</li>
                        </ul>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                            You may request deletion of your data at any time.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">5</span>
                            Data Deletion & Account Removal
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            You may request complete deletion of your data, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 mb-6">
                            <li>User record</li>
                            <li>Encrypted access tokens</li>
                            <li>Cached analytics</li>
                        </ul>

                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                                To request deletion, use the in-app account deletion option or contact us at:
                            </p>
                            <p className="text-blue-600 dark:text-blue-400 font-medium text-sm m-0">
                                Email: support@infini8graph.com
                            </p>
                        </div>

                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-700 dark:text-red-300 text-sm m-0">
                                ⚠️ Data deletion is permanent and cannot be undone.
                            </p>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">6</span>
                            Third-Party Services
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">infini8Graph integrates with the following third-party services:</p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xl">📊</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">Meta Platforms / Instagram Graph API</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs">For analytics data</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xl">🗄️</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">Supabase</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs">Database and secure data storage</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xl">🛡️</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">Cloudflare</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs">Secure tunneling and network protection</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="text-xl">🚀</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">Vercel</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs">Website hosting</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm">
                            These services process data only as required to operate the Service and are governed by their own privacy policies.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">7</span>
                            Cookies
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            We use cookies only for authentication and security purposes, such as:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 mb-4">
                            <li>Maintaining your login session</li>
                            <li>Protecting against unauthorized access</li>
                        </ul>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                            We do not use tracking or advertising cookies.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">8</span>
                            Children&apos;s Privacy
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400">
                            infini8Graph is not intended for individuals under the age of 13. We do not knowingly collect personal data from children.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">9</span>
                            International Data Transfers
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400">
                            Your data may be processed in servers located outside your country of residence. By using the Service, you consent to such transfers in accordance with applicable laws.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold">10</span>
                            Changes to This Privacy Policy
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                            Continued use of the Service after changes constitutes acceptance of the updated policy.
                        </p>
                    </section>
                </article>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            © 2026 infini8Graph. All rights reserved.
                        </p>
                        <a
                            href="/"
                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            ← Back to Home
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}
