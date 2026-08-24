# Network Snapshot

Network Snapshot is a simple GNOME Shell extension that provides quick access to essential network information directly from the GNOME top panel.

## Features

- Shows the active connection type
- Displays the active network interface
- Displays the local IPv4 address
- Displays the default gateway
- Displays DNS servers
- Shows active VPN connections
- Refreshes network information on demand
- Copies the current network snapshot to the clipboard
- Opens GNOME Network Settings directly
- Uses native GNOME Shell styling

## Requirements

- GNOME Shell 50
- NetworkManager
- nmcli
- GNOME Control Center

## Installation

### 1. Clone the repository

Open a terminal and clone Network Snapshot into your GNOME Shell extensions directory:

```bash
git clone https://github.com/dhruvtucker/network-snapshot.git ~/.local/share/gnome-shell/extensions/network-snapshot@dhruvtucker
```

gnome-extensions enable network-snapshot@dhruvtucker## Installation

### 1. Clone the repository

Open a terminal and clone Network Snapshot into your GNOME Shell extensions directory:

```bash
git clone https://github.com/dhruvtucker/network-snapshot.git ~/.local/share/gnome-shell/extensions/network-snapshot@dhruvtucker
```

### 2. Reload GNOME Shell

Log out of your GNOME session and log back in so GNOME Shell can discover the extension.

### 3. Enable Network Snapshot

Enable the extension from the terminal:

```bash
gnome-extensions enable network-snapshot@dhruvtucker
```

Alternatively, enable **Network Snapshot** using the GNOME Extensions application.

### Uninstall

Disable the extension:

```bash
gnome-extensions disable network-snapshot@dhruvtucker
```

Then remove the extension directory:

```bash
rm -rf ~/.local/share/gnome-shell/extensions/network-snapshot@dhruvtucker
```

Log out and back in to complete the removal.

## Usage

Click the Network Snapshot icon in the GNOME top panel to view your current network information.

Select **Refresh** to manually update the information.

Select **Copy Snapshot** to copy the displayed network information to your clipboard.

Select **Network Settings** to open GNOME's network configuration.

## License

MIT License
