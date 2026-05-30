import { useApp } from '../../context/AppContext';
import type { TabId } from '../../types';

const ALL_TABS: { id: TabId; label: string; short: string; adminOnly?: boolean }[] = [
  { id: 'pos', label: 'Point of Sale', short: 'POS' },
  { id: 'products', label: 'Products', short: 'Products', adminOnly: true },
  { id: 'tax', label: 'Tax', short: 'Tax', adminOnly: true },
  { id: 'analytics', label: 'Analytics', short: 'Stats', adminOnly: true },
  { id: 'users', label: 'Users', short: 'Users', adminOnly: true },
];

export function NavTabs() {
  const { activeTab, requestTab, isAdmin } = useApp();
  const tabs = isAdmin ? ALL_TABS : ALL_TABS.filter((tab) => !tab.adminOnly);

  return (
    <nav className="nav-tabs" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => requestTab(tab.id)}
        >
          <span className="nav-tab-label">{tab.label}</span>
          <span className="nav-tab-short">{tab.short}</span>
        </button>
      ))}
    </nav>
  );
}
