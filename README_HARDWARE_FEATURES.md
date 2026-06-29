# iView Web Hardware Feature Flags

The PHP web frontend cannot read qmake `.pro` `DEFINES` directly because PHP runs at runtime. This project uses `hardware_profile.php` and `hardware_features.php` to mirror the Qt/QML hardware profile.

## Profiles

Default file used by the web UI:

```php
hardware_profile.php
```

Preset profiles are included:

```text
hardware_profile.eth_only.php  # Ethernet only
hardware_profile.wifi.php      # WiFi + Hotspot
hardware_profile.full.php      # WiFi + Hotspot + 5G flag
```

To enable WiFi + Hotspot:

```bash
cp hardware_profile.wifi.php hardware_profile.php
```

To use Ethernet-only:

```bash
cp hardware_profile.eth_only.php hardware_profile.php
```

To enable the full profile flag set:

```bash
cp hardware_profile.full.php hardware_profile.php
```

## Feature Flags

The web UI exposes these flags to PHP and JavaScript:

```text
IVIEW_HAS_WIFI
IVIEW_HAS_HOTSPOT
IVIEW_HAS_5G
window.iviewFeatures.wifi
window.iviewFeatures.hotspot
window.iviewFeatures.cellular5g
```

## Behavior

When WiFi is disabled:

- The WiFi menu item is hidden.
- `wifi.php` redirects to `network.php?feature=wifi_disabled`.
- `network.php` hides WiFi and Hotspot sections.
- `myfunctionNetwork.js` blocks WiFi/Hotspot commands.
- `myfunctionWifiManager.js` does not open WiFi/Hotspot backend sockets.

Keep this profile synchronized with the Qt build profile:

```bash
qmake RFPowerMonitors.pro                  # Ethernet-only
qmake RFPowerMonitors.pro CONFIG+=HW_WIFI  # WiFi + Hotspot
qmake RFPowerMonitors.pro CONFIG+=HW_5G    # 5G flag
```
