import Gio from 'gi://Gio';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async');

async function runCommand(argv) {
    const proc = Gio.Subprocess.new(
        argv,
        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
    );

    const [stdout, stderr] =
        await proc.communicate_utf8_async(null, null);

    if (!proc.get_successful())
        throw new Error(stderr.trim());

    return stdout.trim();
}

export default class NetworkSnapshotExtension extends Extension {
    enable() {
        this._indicator = new PanelMenu.Button(
            0.5,
            this.metadata.name,
            false
        );

        this._panelIcon = new St.Icon({
            icon_name: 'network-wired-symbolic',
            style_class: 'system-status-icon',
        });

        this._indicator.add_child(this._panelIcon);

        // Header
        this._headerItem = new PopupMenu.PopupImageMenuItem(
            'Network Snapshot',
            'network-transmit-receive-symbolic',
            {reactive: false}
        );

        this._indicator.menu.addMenuItem(this._headerItem);

        this._indicator.menu.addMenuItem(
            new PopupMenu.PopupSeparatorMenuItem()
        );

        // Network information
        this._connectionItem = this._createInfoItem(
            'Connection: —',
            'network-transmit-receive-symbolic'
        );

        this._interfaceItem = this._createInfoItem(
            'Interface: —',
            'network-wired-symbolic'
        );

        this._ipItem = this._createInfoItem(
            'Local IP: —',
            'computer-symbolic'
        );

        this._gatewayItem = this._createInfoItem(
            'Gateway: —',
            'network-server-symbolic'
        );

        this._dnsItem = this._createInfoItem(
            'DNS: —',
            'network-transmit-receive-symbolic'
        );

        this._vpnItem = this._createInfoItem(
            'VPN: —',
            'channel-secure-symbolic'
        );

        this._indicator.menu.addMenuItem(this._connectionItem);
        this._indicator.menu.addMenuItem(this._interfaceItem);
        this._indicator.menu.addMenuItem(this._ipItem);
        this._indicator.menu.addMenuItem(this._gatewayItem);
        this._indicator.menu.addMenuItem(this._dnsItem);
        this._indicator.menu.addMenuItem(this._vpnItem);

        this._indicator.menu.addMenuItem(
            new PopupMenu.PopupSeparatorMenuItem()
        );

        // Actions
        this._refreshItem = new PopupMenu.PopupImageMenuItem(
            'Refresh',
            'view-refresh-symbolic'
        );

        this._refreshItem.connect('activate', () => {
            this._refresh();
        });

        this._copyItem = new PopupMenu.PopupImageMenuItem(
            'Copy Snapshot',
            'edit-copy-symbolic'
        );

        this._copyItem.connect('activate', () => {
            this._copySnapshot();
        });

        this._settingsItem = new PopupMenu.PopupImageMenuItem(
            'Network Settings',
            'preferences-system-network-symbolic'
        );

        this._settingsItem.connect('activate', () => {
            this._openNetworkSettings();
        });

        this._indicator.menu.addMenuItem(this._refreshItem);
        this._indicator.menu.addMenuItem(this._copyItem);
        this._indicator.menu.addMenuItem(this._settingsItem);

        // Refresh whenever the user opens the menu.
        this._indicator.menu.connect(
            'open-state-changed',
            (_menu, isOpen) => {
                if (isOpen)
                    this._refresh();
            }
        );

        Main.panel.addToStatusArea(
            this.uuid,
            this._indicator
        );
    }

    _createInfoItem(text, iconName) {
        return new PopupMenu.PopupImageMenuItem(
            text,
            iconName,
            {
                reactive: false,
                can_focus: false,
            }
        );
    }

    async _refresh() {
        this._setLoadingState();

        try {
            const devices = await runCommand([
                'nmcli',
                '-t',
                '-f',
                'DEVICE,TYPE,STATE',
                'device',
                'status',
            ]);

            const connectedDevice = devices
                .split('\n')
                .map(line => line.split(':'))
                .find(parts =>
                    parts.length >= 3 &&
                    parts[2] === 'connected' &&
                    (parts[1] === 'wifi' || parts[1] === 'ethernet')
                );

            if (!connectedDevice)
                throw new Error(
                    'No active Wi-Fi or Ethernet connection'
                );

            const interfaceName = connectedDevice[0];
            const connectionType = connectedDevice[1];

            const details = await runCommand([
                'nmcli',
                '-g',
                'IP4.ADDRESS,IP4.GATEWAY,IP4.DNS',
                'device',
                'show',
                interfaceName,
            ]);

            const lines = details
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean);

            const ip =
                lines[0]?.split('/')[0] ?? 'Unknown';

            const gateway =
                lines[1] ?? 'Unknown';

            const dns =
                lines.slice(2).join(', ') || 'Unknown';

            const activeConnections = await runCommand([
                'nmcli',
                '-t',
                '-f',
                'TYPE,NAME',
                'connection',
                'show',
                '--active',
            ]);

            const vpnConnections = activeConnections
                .split('\n')
                .map(line => line.split(':'))
                .filter(parts =>
                    parts[0] === 'vpn' ||
                    parts[0] === 'wireguard'
                )
                .map(parts =>
                    parts.slice(1).join(':')
                );

            const connectionLabel =
                connectionType === 'wifi'
                    ? 'Wi-Fi'
                    : 'Ethernet';

            this._connectionItem.label.text =
                `Connection: ${connectionLabel}`;

            this._interfaceItem.label.text =
                `Interface: ${interfaceName}`;

            this._ipItem.label.text =
                `Local IP: ${ip}`;

            this._gatewayItem.label.text =
                `Gateway: ${gateway}`;

            this._dnsItem.label.text =
                `DNS: ${dns}`;

            this._vpnItem.label.text =
                vpnConnections.length
                    ? `VPN: ${vpnConnections.join(', ')}`
                    : 'VPN: Not connected';

            // Match the panel icon to the active connection.
            this._panelIcon.icon_name =
                connectionType === 'wifi'
                    ? 'network-wireless-signal-excellent-symbolic'
                    : 'network-wired-symbolic';

        } catch (error) {
            console.error(`Network Snapshot: ${error}`);

            this._connectionItem.label.text =
                'Connection: unavailable';

            this._interfaceItem.label.text =
                'Interface: unavailable';

            this._ipItem.label.text =
                'Local IP: unavailable';

            this._gatewayItem.label.text =
                'Gateway: unavailable';

            this._dnsItem.label.text =
                'DNS: unavailable';

            this._vpnItem.label.text =
                'VPN: unavailable';

            this._panelIcon.icon_name =
                'network-offline-symbolic';
        }
    }

    _setLoadingState() {
        this._connectionItem.label.text =
            'Connection: checking…';

        this._interfaceItem.label.text =
            'Interface: checking…';

        this._ipItem.label.text =
            'Local IP: checking…';

        this._gatewayItem.label.text =
            'Gateway: checking…';

        this._dnsItem.label.text =
            'DNS: checking…';

        this._vpnItem.label.text =
            'VPN: checking…';
    }

    _copySnapshot() {
        const text = [
            'Network Snapshot',
            '----------------',
            this._connectionItem.label.text,
            this._interfaceItem.label.text,
            this._ipItem.label.text,
            this._gatewayItem.label.text,
            this._dnsItem.label.text,
            this._vpnItem.label.text,
        ].join('\n');

        St.Clipboard.get_default().set_text(
            St.ClipboardType.CLIPBOARD,
            text
        );

        Main.notify(
            'Network Snapshot',
            'Network information copied to clipboard.'
        );
    }

    _openNetworkSettings() {
        try {
            Gio.Subprocess.new(
                [
                    'gnome-control-center',
                    'network',
                ],
                Gio.SubprocessFlags.NONE
            );
        } catch (error) {
            console.error(`Network Snapshot: ${error}`);

            Main.notify(
                'Network Snapshot',
                'Could not open Network Settings.'
            );
        }
    }

    disable() {
        this._indicator?.destroy();

        this._indicator = null;
        this._panelIcon = null;
        this._headerItem = null;
        this._connectionItem = null;
        this._interfaceItem = null;
        this._ipItem = null;
        this._gatewayItem = null;
        this._dnsItem = null;
        this._vpnItem = null;
        this._refreshItem = null;
        this._copyItem = null;
        this._settingsItem = null;
    }
}
