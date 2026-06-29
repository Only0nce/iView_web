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
    <title>iView</title>
    <meta name="description" content="4 Wire to ED-137 Converter" />
    <meta name="keywords" content="ED137, SIP" />
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
    <link rel="stylesheet" type="text/css" href="style.css" title="style" />
    <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
    <script src="jquery.min.js"></script>
    <script type="text/javascript" src="jquery-latest.min.js"></script>
    <script type="text/javascript" src="jquery-ui.js"></script>
    <!--  <script type="text/javascript" src="countUp.js"></script>-->
    <script type="text/javascript" src="./plotly-latest.min.js"></script>
    <script type="text/javascript">

    </script>

    <style>
    </style>
</head>

<body>
    <div id="header">
        <div id="logo">
            <div id="logo_text">
                <h1><a href="index.php"><span class="logo_colour">RF Power Sensor Monitoring System</span></a></h1>
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
                <li><a href="role.php?id=0">ROLE</a></li>
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

        <div class="container">
            <h3 class="truelanLabel">THRULAN RF POWER SENSOR</h3>
            <button id="unitWattActive" name="unitWattActive" onclick="setUnit(false)"
                style="left: calc(100% - 80px); background-color: #009688FF;"
                class="w3-button w3-teal w3-large w3-padding-large">W</button>
            <button id="unitDBActive" name="unitDBActive" onclick="setUnit(true)"
                style="left: calc(100% - 160px); background-color: #00968840;"
                class="w3-button w3-teal w3-large w3-padding-large">dBm</button>
        </div>


        <div class="container1"
            style="display: flex; flex-direction: row; flex-wrap: wrap; align-content: flex-start; ">

            <?php
for ($i = 1; $i <= 16; $i++) {
?>

            <div class="card" id="card<?php echo $i; ?>" name="card<?php echo $i; ?>" style="display: none; width:35%;">
                <h3 class="title" id="title<?php echo $i; ?>" name="title<?php echo $i; ?>">Card <?php echo $i; ?></h3>
                <h3 class="fwdLabel" id="fwdValue<?php echo $i; ?>" name="fwdValue<?php echo $i; ?>">0.00 W</h3>
                <span class="fwdpowerw" id="fwdUnit<?php echo $i; ?>" name="fwdUnit<?php echo $i; ?>"> Forward Power(W)
                </span>

                <div class="barfwd">
                    <div class="emptybar"></div>
                    <div class="filledbar" id="barFwdLevel<?php echo $i; ?>" name="barFwdLevel<?php echo $i; ?>"></div>
                </div>

                <div class="divRwdVswr">
                    <!-- <h3 class="rwdLabel" id="rwdValue<?php echo $i; ?>" name="rwdValue<?php echo $i; ?>">0.00 W</h3> -->
                    <h3 class="rwdLabel" id="rssiValue<?php echo $i; ?>" name="rwdValue<?php echo $i; ?>">0.00 dBm</h3>
                    <h3 class="vswrLabel" id="swrValue<?php echo $i; ?>" name="swrValue<?php echo $i; ?>">1.000 </h3>
                </div>

                <div class="divBarRwdVswr">
                    <div class="barrwd" id="barrwd<?php echo $i; ?>">
                        <div class="emptybar"></div>
                        <div class="filledbar" id="barRssiLevel<?php echo $i; ?>" name="barRssiLevel<?php echo $i; ?>">
                        </div>
                    </div>
                    <div class="barvswr" id="barvswr<?php echo $i; ?>">
                        <div class="emptybar"></div>
                        <div class="filledbar" id="barVswrLevel<?php echo $i; ?>" name="barVswrLevel<?php echo $i; ?>">
                        </div>
                    </div>
                </div>

                <div class="divRwdVswrLabel">
                    <span class="rwdpowerlabel" id="rwdUnit<?php echo $i; ?>" name="rwdUnit<?php echo $i; ?>"> RSSI
                        (dBm) </span>
                    <span class="vswrlabel"> VSWR </span>
                </div>

                <div class="cardDisconnect" id="cardDisconnect<?php echo $i; ?>" name="cardDisconnect<?php echo $i; ?>"
                    style="display: block;">
                    <img src="img/warning-icon.png" alt="warning" class="imgCenter">
                    <span class="cardDisconnectLabel"> Not Connected </span>
                </div>
            </div>

            <div class="cardRssi" id="card_uart<?php echo $i; ?>" name="card_uart<?php echo $i; ?>"
                style="display: none;">
                <h3 class="title" id="title_uart<?php echo $i; ?>" name="title_uart<?php echo $i; ?>">RSSI</h3>
                <h3 class="fwdLabel" id="rssi<?php echo $i; ?>" name="rssi<?php echo $i; ?>">-130</h3>
                <span class="fwdpowerw" id="fwdUnit<?php echo $i; ?>" name="fwdUnit<?php echo $i; ?>"> RSSI (dBm)
                </span>

                <div class="barfwd">
                    <div class="emptybar"></div>
                    <div class="filledbar" id="barRSSILevel<?php echo $i; ?>" name="barRSSILevel<?php echo $i; ?>">
                    </div>
                </div>

                <div class="divPowerButton">
                    <button class="powerButton" id="setl1power<?php echo $i; ?>" name="setl1power<?php echo $i; ?>"
                        onclick="setl1power(<?php echo $i; ?>)">L1</button>
                    <button class="powerButton" id="setl2power<?php echo $i; ?>" name="setl2power<?php echo $i; ?>"
                        onclick="setl2power(<?php echo $i; ?>)">L2</button>
                    <button class="powerButton" id="sethipower<?php echo $i; ?>" name="sethipower<?php echo $i; ?>"
                        onclick="sethipower(<?php echo $i; ?>)">H</button>
                </div>

                <div class="divCHSelect">
                    <button class="upDownButton" onclick="decChannel(<?php echo $i; ?>)">-</button>
                    <button class="contentButton" id="chSel<?php echo $i; ?>" name="chSel<?php echo $i; ?>"
                        disabled>CH:0</button>
                    <button class="upDownButton" onclick="incChannel(<?php echo $i; ?>)">+</button>
                </div>

                <div class="divSQLSelect">
                    <button class="upDownButton" onclick="decSqlLevel(<?php echo $i; ?>)">-</button>
                    <button class="contentButton" id="sqlLevel<?php echo $i; ?>" name="sqlLevel<?php echo $i; ?>"
                        disabled>15</button>
                    <button class="upDownButton" onclick="incSqlLevel(<?php echo $i; ?>)">+</button>
                </div>

                <div class="divTempShow">
                    <span id="CTRLtemp<?php echo $i; ?>" name="CTRLtemp<?php echo $i; ?>"> 37°C </span>
                </div>

                <div class="divTrxShow">
                    <span id="trxShow<?php echo $i; ?>" name="trxShow<?php echo $i; ?>"></span>
                </div>
            </div>

            <div class="card" id="card_plot<?php echo $i; ?>" name="card_plot<?php echo $i; ?>"
                style="display: none; width:60%;">
                <div id="myPlot<?php echo $i; ?>"></div>

                <div class="cardDisconnect" id="cardplotDisconnect<?php echo $i; ?>"
                    name="cardDisconnect<?php echo $i; ?>" style="display: block;">
                    <img src="img/warning-icon.png" alt="warning" class="imgCenter">
                    <span class="cardDisconnectLabel"> Not Connected </span>
                </div>
            </div>

            <?php
}
?>

        </div>


    </div>


    </div>
    </div>
    <script type="text/javascript" src="myfunctionIndexServer.js?v=<?php echo time(); ?>"></script>
</body>

</html>