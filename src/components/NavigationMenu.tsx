import { useState } from 'react'
import { AlmoxSelect } from './AlmoxSelect'
import { DeviceList } from './DeviceList'
import { PDFSignature } from './PDFSignature'
import './NavigationMenu.css'

type TabType = 'main' | 'signatures'

export function NavigationMenu() {
    const [activeTab, setActiveTab] = useState<TabType>('main')
    const [selectedAlmoxId, setSelectedAlmoxId] = useState<number | null>(null)

    return (
        <div className="navigation-container">
            <nav className="navigation-menu">
                <button
                    className={`nav-tab ${activeTab === 'main' ? 'active' : ''}`}
                    onClick={() => setActiveTab('main')}
                >
                    🏠 Principal
                </button>
                <button
                    className={`nav-tab ${activeTab === 'signatures' ? 'active' : ''}`}
                    onClick={() => setActiveTab('signatures')}
                >
                    ✍️ Assinaturas
                </button>
            </nav>

            <div className="tab-content">
                {activeTab === 'main' && (
                    <main>
                        <section className="selection-area">
                            <AlmoxSelect onSelect={setSelectedAlmoxId} />
                        </section>

                        {selectedAlmoxId && (
                            <section className="device-area">
                                <DeviceList almoxId={selectedAlmoxId} />
                            </section>
                        )}
                    </main>
                )}

                {activeTab === 'signatures' && (
                    <main>
                        <PDFSignature />
                    </main>
                )}
            </div>
        </div>
    )
}
