export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <h1 className="text-5xl font-bold mb-4">DBMux</h1>
                    <p className="text-xl text-gray-300 mb-8">
                        A flexible database management CLI tool with persistent
                        configuration
                    </p>

                    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto mb-12">
                        <pre className="text-left text-sm text-green-400 overflow-x-auto">
                            <code>
                                {`# Install via npm
npm install -g dbmux

# Or via bun
bun add -g dbmux

# Get started
dbmux --help`}
                            </code>
                        </pre>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">
                                Multi-Database Support
                            </h3>
                            <p className="text-gray-400">
                                Connect to PostgreSQL with MySQL and SQLite
                                support coming soon
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">
                                Persistent Config
                            </h3>
                            <p className="text-gray-400">
                                Save and manage multiple database connections
                                locally
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">
                                Dump and Restore
                            </h3>
                            <p className="text-gray-400">
                                Easily backup and restore your databases with
                                built-in history tracking
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
