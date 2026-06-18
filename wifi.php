<?php
session_start();
if($_SESSION['UserID'] == "")
{
    echo("<script>location.href = '/login.php';</script>");
    exit;
}

if($_SESSION['Status'] != "ADMIN")
{
    echo("<script>location.href = '/login.php';</script>");
    exit;
}
?>
<!DOCTYPE HTML>
<html>
<head>
    <title>iView - Wi-Fi Manager</title>
    <meta name="description" content="Professional Audio Streamer" />
    <meta name="keywords" content="Audio Streamer, Music Streamer" />
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
    <link rel="stylesheet" type="text/css" href="style.css" title="style" />
    <link rel="stylesheet" type="text/css" href="wifi_theme.css?v=<?php echo time(); ?>" />
    <link rel="stylesheet" type="text/css" href="rf-console.css?v=<?php echo time(); ?>" />
    <script src="jquery.min.js"></script>
    <script type="text/javascript" src="myfunctionWifiManager.js?v=<?php echo time(); ?>" defer></script>
</head>
<body class="rf-console rf-console-wifi">
    <div id="main">
        <div id="header">
            <div id="logo">
                <div id="logo_text">
                    <h1><a href="index.php"><span class="logo_colour">RF Power Sensor Monitoring System</span></a></h1>
                </div>
            </div>
            <div id="menubar">
                <ul id="menu">
                    <li><a href="index.php">HOME</a></li>
                    <li><a href="datalogger.php">LOG</a></li>
                    <li><a href="cal.php?id=1">CAL</a></li>
                    <li><a href="thrulan.php?id=0">Power Sensor</a></li>
                    <li><a href="snmp_update.php">Rx SNMP Info</a></li>
                    <li><a href="role.php?id=0">ROLE</a></li>
                    <li><a href="network.php">NETWORK</a></li>
                    <li class="selected"><a href="wifi.php">WiFi</a></li>
                    <li><a href="update.php">SYSTEM</a></li>
                    <li><a href="logout.php">LOGOUT</a></li>
                    <li><a href="changepass.php">CHANGE PASS.</a></li>
                </ul>
            </div>
        </div>

        <div id="site_content">
            <div id="wifi_content">
                <div class="wifi-page-head">
                    <div class="wifi-title-wrap">
                        <h3>Wi‑Fi Management</h3>
                    </div>
                </div>

                <div id="wifiBanner" class="wifi-banner wifi-banner-hidden"></div>

                <div class="wifi-panel wifi-summary-panel">
                    <div class="wifi-summary-top">
                        <div class="wifi-summary-main">
                            <div>
                                <div class="wifi-panel-kicker">Current Status</div>
                                <div class="wifi-current-row">
                                    <span id="wifiStatusBadge" class="wifi-badge wifi-badge-off">Disconnected</span>
                                    <strong id="wifiCurrentNetworkLabel" class="wifi-current-ssid">—</strong>
                                </div>
                            </div>
                        </div>
                        <div class="wifi-inline-actions wifi-inline-actions-compact">
                            <button class="button button2 wifi-inline-btn" type="button" id="wifiReloadBtn">Reload</button>
                            <button class="button button2 wifi-inline-btn wifi-toggle-btn" type="button" id="wifiToggleBtn">Turn Wi‑Fi On</button>
                        </div>
                    </div>

                    <div class="wifi-info-grid wifi-info-grid-wide">
                        <div class="wifi-info-box">
                            <span class="wifi-label">Device</span>
                            <strong id="wifiDeviceLabel">—</strong>
                        </div>
                        <div class="wifi-info-box">
                            <span class="wifi-label">IP Address</span>
                            <strong id="wifiIpLabel">—</strong>
                        </div>
                        <div class="wifi-info-box">
                            <span class="wifi-label">Netmask</span>
                            <strong id="wifiNetmaskLabel">—</strong>
                        </div>
                        <div class="wifi-info-box">
                            <span class="wifi-label">Gateway</span>
                            <strong id="wifiGatewayLabel">—</strong>
                        </div>
                        <div class="wifi-info-box">
                            <span class="wifi-label">Available Networks</span>
                            <strong id="wifiNetworkSummary">0 networks</strong>
                        </div>
                    </div>
                </div>

                <div class="wifi-panel wifi-summary-panel hotspot-summary-panel">
                    <div class="wifi-summary-top">
                        <div class="wifi-summary-main">
                            <div>
                                <div class="wifi-panel-kicker">Hotspot (AP)</div>
                                <div class="wifi-current-row">
                                    <span id="hotspotStatusBadge" class="wifi-badge wifi-badge-off">Disabled</span>
                                    <strong id="hotspotCurrentSsid" class="wifi-current-ssid wifi-current-ssid-small">—</strong>
                                </div>
                                <div class="wifi-note hotspot-note">Share connection to nearby devices.</div>
                            </div>
                        </div>
                        <div class="wifi-inline-actions wifi-inline-actions-compact">
                            <button class="button button2 wifi-inline-btn hotspot-toggle-btn" type="button" id="hotspotToggleBtn">Turn Hotspot On</button>
                        </div>
                    </div>

                    <div class="wifi-info-grid hotspot-info-grid">
                        <div class="wifi-info-box">
                            <span class="wifi-label">Hotspot IP</span>
                            <strong id="hotspotIpLabel">—</strong>
                        </div>
                        <div class="wifi-info-box">
                            <span class="wifi-label">Subnet</span>
                            <strong id="hotspotNetmaskLabel">—</strong>
                        </div>
                        <div class="wifi-info-box">
                            <span class="wifi-label">Gateway</span>
                            <strong id="hotspotGatewayLabel">—</strong>
                        </div>
                    </div>
                </div>

                <div class="wifi-panel wifi-list-panel">
                    <div class="wifi-panel-title-row wifi-panel-title-row-tight">
                        <div>
                            <h4>Available Networks</h4>
                            <div class="wifi-note">Select a network to connect, or open Advanced to edit the saved profile IPv4 settings.</div>
                        </div>
                    </div>
                    <div id="netList" class="wifi-network-list">
                        <div class="wifi-empty-state">
                            <h5>Scanning networks...</h5>
                            <p>Please wait while nearby Wi‑Fi access points are detected.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="wifiModalOverlay" class="wifi-modal-overlay">
        <div class="wifi-modal-box">
            <div class="wifi-modal-header">
                <h4 id="wifiModalTitle">Join Wi‑Fi</h4>
                <button type="button" class="wifi-modal-close" id="wifiModalClose">×</button>
            </div>
            <div class="wifi-modal-body">
                <div class="selected_list">
                    <span>Password</span>
                    <input id="wifiPasswordInput" class="form-control" type="password" placeholder="Enter Wi‑Fi password" />
                </div>
                <div class="selected_list wifi-checkbox-row">
                    <label><input type="checkbox" id="wifiShowPassword"> Show password</label>
                </div>
                <div id="wifiModalError" class="wifi-modal-error"></div>
            </div>
            <div class="wifi-modal-footer">
                <button class="button button2 wifi-modal-btn-secondary" type="button" id="wifiModalCancel">Cancel</button>
                <button class="button button2 wifi-modal-btn-primary" type="button" id="wifiJoinBtn">Join Network</button>
            </div>
        </div>
    </div>

    <div id="wifiAdvOverlay" class="wifi-modal-overlay">
        <div class="wifi-modal-box wifi-modal-box-wide">
            <div class="wifi-modal-header">
                <h4 id="wifiAdvTitle">Advanced Wi‑Fi Settings</h4>
                <button type="button" class="wifi-modal-close" id="wifiAdvClose">×</button>
            </div>
            <div class="wifi-modal-body">
                <div class="wifi-note" id="wifiAdvSub">Saved or active Wi‑Fi profile</div>

                <div class="wifi-method-grid">
                    <label class="wifi-method-card">
                        <input type="radio" name="ipv4method" value="auto" checked>
                        <span class="wifi-method-title">Automatic (DHCP)</span>
                        <span class="wifi-method-sub">Get IP settings automatically from the router.</span>
                    </label>
                    <label class="wifi-method-card">
                        <input type="radio" name="ipv4method" value="manual">
                        <span class="wifi-method-title">Manual</span>
                        <span class="wifi-method-sub">Set IP, Subnet, Gateway, and DNS manually.</span>
                    </label>
                </div>

                <div class="wifi-form-grid">
                    <div class="selected_list wifi-field-half">
                        <span>IP Address</span>
                        <input id="addrIp" class="form-control" type="text" placeholder="192.168.1.50" disabled />
                    </div>
                    <div class="selected_list wifi-field-half">
                        <span>Subnet Mask</span>
                        <input id="addrMask" class="form-control" type="text" placeholder="255.255.255.0" disabled />
                    </div>
                    <div class="selected_list wifi-field-full">
                        <span>Gateway</span>
                        <div class="wifi-input-with-button">
                            <input id="addrGw" class="form-control" type="text" placeholder="192.168.1.1" disabled />
                            <button id="addrDel" type="button" class="button button2 wifi-clear-btn">Clear</button>
                        </div>
                    </div>
                    <div class="selected_list wifi-field-full">
                        <span>Current State</span>
                        <input id="currentIpLabel" class="form-control" type="text" value="Now: —" disabled />
                    </div>
                </div>

                <div class="wifi-dns-row">
                    <label><input type="checkbox" id="dnsAutoToggle" checked> Use automatic DNS</label>
                </div>
                <div class="selected_list">
                    <span>DNS Servers</span>
                    <input id="dnsInput" class="form-control" type="text" placeholder="8.8.8.8, 1.1.1.1" disabled />
                </div>
            </div>
            <div class="wifi-modal-footer">
                <button class="button button2 wifi-modal-btn-secondary" type="button" id="wifiAdvCancel">Cancel</button>
                <button class="button button2 wifi-modal-btn-danger" type="button" id="wifiAdvDisconnect">Forget Connection</button>
                <button class="button button2 wifi-modal-btn-primary" type="button" id="wifiAdvSave">Save</button>
            </div>
        </div>
    </div>

    <script>
        window.WIFI_API_URL = 'api.php';
    </script>
</body>
</html>
