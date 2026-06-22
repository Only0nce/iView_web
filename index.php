<?php
    session_start();
    if($_SESSION['UserID'] == "")
    {
        echo("<script>location.href = '/login.php';</script>");
    }

    if($_SESSION['Status'] != "ADMIN")
    {
        echo("<script>location.href = '/login.php';</script>");
    }
?>
<!DOCTYPE HTML>
<?php
include('dbConfig.php');
include('ListAudioGain.php');
// ปิด cache ทุกชนิด
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); // วันหมดอายุย้อนหลัง
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
?>
<html>

<head>
    <title>iView RF Power Monitor</title>
    <meta name="description" content="4 Wire to ED-137 Converter" />
    <meta name="keywords" content="ED137, SIP" />
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" type="text/css" href="style.css" title="style" />
    <link rel="stylesheet" type="text/css" href="rf-console.css?v=<?php echo time(); ?>" />
    <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
    <script src="jquery.min.js"></script>
    <script type="text/javascript" src="jquery-latest.min.js"></script>
    <script type="text/javascript" src="jquery-ui.js"></script>
    <!--  <script type="text/javascript" src="countUp.js"></script>-->
    <script type="text/javascript" src="./plotly-latest.min.js"></script>
  <script type="text/javascript" src="rf-theme.js?v=<?php echo time(); ?>"></script>
</head>

<body class="rf-console rf-console-home rf-console-home-svg rf-dashboard-2x8 rf-dashboard-stable-fit">
    <div id="header">
        <div id="logo">
            <div id="logo_text">
                <h1><a href="index.php"><span class="logo_colour">iView RF Power Monitor</span></a></h1>
            </div>
        </div>
        <!--
  <div class="showHeaderDiv">
    <h1 class="text-align-center">UHF Multi-coupler </h1>
  </div>
-->
        <div id="menubar">
            <ul id="menu">
                <li class="selected"><a href="index.php">HOME</a></li>
                <li><a href="datalogger.php">LOG</a></li>
                <li><a href="cal.php?id=1">CAL</a></li>
                <li><a href="thrulan.php?id=0">Power Sensor</a></li>
                <li><a href="snmp_update.php">Rx SNMP Info</a></li>
                <li><a href="role.php?id=0">SITE</a></li>
                <li><a href="network.php">NETWORK</a></li>
                <li><a href="wifi.php">WiFi</a></li>
                <li><a href="update.php">system</a></li>
                <li><a href="logout.php">LOGOUT</a></li>
                <li><a href="changepass.php">CHANGE PASS.</a></li>
            </ul>
        </div>
    </div>

    <div id="site_content">

        <?php
    if(isset($_POST['system'])){
      $command = $_POST['systemcommamd'];
      if ($command == '1'){
          echo '<script language="javascript">';
          echo "alert('Syetem will be reboot.')";
          echo '</script>';
          system("sudo reboot");
      }
      else if ($command == '2'){
          echo '<script language="javascript">';
          echo "alert('System shutting down. Goodbye.')";
          echo '</script>';
          system("sudo shutdown -h 0");
      }
      else if ($command == '3'){
          echo '<script language="javascript">';
          echo "alert('Restart ED-137 Converter Service')";
          echo '</script>';
          system("sudo /etc/init.d/ed137converterd stop > /dev/null 2>&1 &");
      }
    }
    ?>

        <div class="container rf-home-toolbar">
            <div class="rf-home-title-block">
                <h3 class="truelanLabel">iView RF Power Monitor • 16 Devices</h3>
                <span class="rf-home-subtitle">Live Monitoring Dashboard</span>
            </div>
            <div class="rf-toolbar-actions">
                <div class="rf-role-summary" aria-label="Current role summary">
                    <span>Site</span>
                    <strong id="roleNameDisplay">--</strong>
                    <small id="roleDeviceSummary">All: -- | Connect: -- | Disconnect: --</small>
                </div>
                <div class="rf-unit-switch" aria-label="Power unit switch">
                    <button id="unitWattActive" name="unitWattActive" type="button" onclick="setUnit(false)"
                        style="left: calc(100% - 80px); background-color: #009688FF;"
                        class="w3-button w3-teal w3-large w3-padding-large" aria-label="Show power values in watts">W</button>
                    <button id="unitDBActive" name="unitDBActive" type="button" onclick="setUnit(true)"
                        style="left: calc(100% - 160px); background-color: #00968840;"
                        class="w3-button w3-teal w3-large w3-padding-large" aria-label="Show power values in dBm">dBm</button>
                </div>
            </div>
        </div>

        <div class="container1 rf-dashboard-stack" aria-label="Live RF power dashboard">

            <?php
for ($i = 1; $i <= 16; $i++) {
?>

            <section class="rf-device-row" id="deviceDashboard<?php echo $i; ?>" aria-label="RF device <?php echo $i; ?> dashboard">
                <div class="rf-device-layout">
                    <div class="card rf-device-overview" id="card<?php echo $i; ?>" name="card<?php echo $i; ?>" style="display: none;">
                        <header class="rf-overview-head">
                            <h2 class="title rf-device-title" id="title<?php echo $i; ?>" name="title<?php echo $i; ?>">
                                <span class="rf-device-name" id="deviceName<?php echo $i; ?>">Card <?php echo $i; ?></span>
                                <span class="rf-device-frequency" id="deviceFrequency<?php echo $i; ?>">-- MHz</span>
                            </h2>
                            <span class="rf-alert-pill" id="overviewSeverity<?php echo $i; ?>" data-state="warn">WARNING</span>
                        </header>

                        <section class="rf-forward-block" aria-label="Forward power">
                            <strong class="fwdLabel" id="fwdValue<?php echo $i; ?>" name="fwdValue<?php echo $i; ?>">0</strong>
                            <span class="fwdpowerw" id="fwdUnit<?php echo $i; ?>" name="fwdUnit<?php echo $i; ?>">Forward Power (W)</span>
                            <div class="barfwd rf-progress-line">
                                <div class="emptybar"></div>
                                <div class="filledbar" id="barFwdLevel<?php echo $i; ?>" name="barFwdLevel<?php echo $i; ?>"></div>
                            </div>
                        </section>

                        <section class="rf-overview-metrics" aria-label="RF metrics">
                            <div class="rf-metric-card rf-metric-rssi" data-state="warn">
                                <div class="rf-metric-top">
                                    <strong class="rssiValue" id="rssiValue<?php echo $i; ?>" name="rwdValue<?php echo $i; ?>">--</strong>
                                    <span>dBm</span>
                                </div>
                                <span class="rwdpowerlabel" id="rwdUnit<?php echo $i; ?>" name="rwdUnit<?php echo $i; ?>">RSSI</span>
                                <span class="rf-mini-pill" id="rssiState<?php echo $i; ?>" data-state="warn">WEAK</span>
                                <div class="barrssi rf-progress-line" id="barrssi<?php echo $i; ?>">
                                    <div class="emptybar"></div>
                                    <div class="filledbar" id="barRssiLevel<?php echo $i; ?>" name="barRssiLevel<?php echo $i; ?>"></div>
                                </div>
                            </div>

                            <div class="rf-metric-card rf-metric-vswr" data-state="ok">
                                <div class="rf-metric-top">
                                    <strong class="vswrLabel" id="swrValue<?php echo $i; ?>" name="swrValue<?php echo $i; ?>">1</strong>
                                    <span>ratio</span>
                                </div>
                                <span class="vswrlabel">VSWR</span>
                                <span class="rf-mini-pill" id="vswrState<?php echo $i; ?>" data-state="ok">OK</span>
                                <div class="barvswr rf-progress-line" id="barvswr<?php echo $i; ?>">
                                    <div class="emptybar"></div>
                                    <div class="filledbar" id="barVswrLevel<?php echo $i; ?>" name="barVswrLevel<?php echo $i; ?>"></div>
                                </div>
                            </div>

                            <div class="rf-metric-card rf-metric-reflected" data-state="ok">
                                <div class="rf-metric-top">
                                    <strong class="rwdLabel" id="rwdValue<?php echo $i; ?>" name="rwdValue<?php echo $i; ?>">0.00</strong>
                                    <span id="rwdMetricUnit<?php echo $i; ?>">W</span>
                                </div>
                                <span>REFLECTED</span>
                                <span class="rf-mini-pill" id="reflectedState<?php echo $i; ?>" data-state="ok">OK</span>
                                <div class="barrwd rf-progress-line" id="barrwd<?php echo $i; ?>">
                                    <div class="emptybar"></div>
                                    <div class="filledbar" id="barRwdLevel<?php echo $i; ?>" name="barRwdLevel<?php echo $i; ?>"></div>
                                </div>
                            </div>

                            <div class="rf-metric-card rf-metric-status" data-state="warn">
                                <div class="rf-metric-top">
                                    <strong id="rxStatusValue<?php echo $i; ?>">CO_WARN</strong>
                                </div>
                                <span>RX STATUS</span>
                                <span class="rf-mini-pill" id="rxStatusState<?php echo $i; ?>" data-state="warn">WEAK</span>
                            </div>

                            <div class="rf-metric-card rf-metric-sql" data-state="idle">
                                <div class="rf-metric-top">
                                    <strong id="sqlMirrorValue<?php echo $i; ?>">--</strong>
                                </div>
                                <span>SQL LEVEL</span>
                            </div>
                        </section>

                        <footer class="rf-overview-footer">
                            <span><i class="rf-live-dot"></i>WebSocket Live</span>
                            <span><i class="rf-live-dot"></i>SNMP Active / 2.0s</span>
                            <span>Last Update: <b id="lastUpdate<?php echo $i; ?>">--:--:--</b></span>
                            <span class="rf-maxhold-label">MAX-HOLD</span>
                        </footer>

                        <div class="cardDisconnect" id="cardDisconnect<?php echo $i; ?>" name="cardDisconnect<?php echo $i; ?>"
                            style="display: block;">
                            <img src="img/warning-icon.png" alt="warning" class="imgCenter">
                            <span class="cardDisconnectLabel"> Not Connected </span>
                        </div>
                    </div>

                    <div class="card rf-trend-card" id="card_plot<?php echo $i; ?>" name="card_plot<?php echo $i; ?>" style="display: none;">
                        <header class="rf-trend-head">
                            <h3>Live Trend</h3>
                        </header>
                        <div id="myPlot<?php echo $i; ?>" class="rf-trend-plot"></div>
                        <div class="rf-trend-offline-overlay" id="trendOfflineOverlay<?php echo $i; ?>" aria-hidden="true">
                            <span>OFFLINE</span>
                        </div>

                        <div class="cardDisconnect" id="cardplotDisconnect<?php echo $i; ?>"
                            name="cardDisconnect<?php echo $i; ?>" style="display: block;">
                            <img src="img/warning-icon.png" alt="warning" class="imgCenter">
                            <span class="cardDisconnectLabel"> Not Connected </span>
                        </div>
                    </div>
                </div>

                <div class="cardRssi rf-radio-control" id="card_uart<?php echo $i; ?>" name="card_uart<?php echo $i; ?>" style="display: none;">
                    <h3 class="title" id="title_uart<?php echo $i; ?>" name="title_uart<?php echo $i; ?>">Radio Control</h3>
                    <div class="rf-radio-rssi">
                        <strong class="fwdLabel" id="rssi<?php echo $i; ?>" name="rssi<?php echo $i; ?>">-130</strong>
                        <span>RSSI (dBm)</span>
                        <div class="barfwd rf-progress-line">
                            <div class="emptybar"></div>
                            <div class="filledbar" id="barRSSILevel<?php echo $i; ?>" name="barRSSILevel<?php echo $i; ?>"></div>
                        </div>
                    </div>

                    <div class="divPowerButton rf-radio-row">
                        <button class="powerButton" type="button" id="setl1power<?php echo $i; ?>" name="setl1power<?php echo $i; ?>" onclick="setl1power(<?php echo $i; ?>)">L1</button>
                        <button class="powerButton" type="button" id="setl2power<?php echo $i; ?>" name="setl2power<?php echo $i; ?>" onclick="setl2power(<?php echo $i; ?>)">L2</button>
                        <button class="powerButton" type="button" id="sethipower<?php echo $i; ?>" name="sethipower<?php echo $i; ?>" onclick="sethipower(<?php echo $i; ?>)">H</button>
                    </div>

                    <div class="divCHSelect rf-radio-row">
                        <button class="upDownButton" type="button" onclick="decChannel(<?php echo $i; ?>)">-</button>
                        <button class="contentButton" id="chSel<?php echo $i; ?>" name="chSel<?php echo $i; ?>" disabled>CH:0</button>
                        <button class="upDownButton" type="button" onclick="incChannel(<?php echo $i; ?>)">+</button>
                    </div>

                    <div class="divSQLSelect rf-radio-row">
                        <button class="upDownButton" type="button" onclick="decSqlLevel(<?php echo $i; ?>)">-</button>
                        <button class="contentButton" id="sqlLevel<?php echo $i; ?>" name="sqlLevel<?php echo $i; ?>" disabled>15</button>
                        <button class="upDownButton" type="button" onclick="incSqlLevel(<?php echo $i; ?>)">+</button>
                    </div>

                    <div class="rf-radio-footer">
                        <span class="divTempShow" id="CTRLtemp<?php echo $i; ?>" name="CTRLtemp<?php echo $i; ?>">37°C</span>
                        <span class="divTrxShow" id="trxShow<?php echo $i; ?>" name="trxShow<?php echo $i; ?>"></span>
                    </div>
                </div>
            </section>

            <?php
}
?>

        </div>
    </div>

    <script type="text/javascript" src="myfunctionIndexServer.js?v=<?php echo time(); ?>"></script>
</body>

</html>
