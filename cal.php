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
include('ListAudioGain.php')

?>
<html>
<head>
  <title>iView</title>
  <meta name="description" content="4 Wire to ED-137 Converter" />
  <meta name="keywords" content="ED137, SIP" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <link rel="stylesheet" type="text/css" href="rf-console.css?v=<?php echo time(); ?>" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="cal.js?v=<?php echo time(); ?>"></script>
</head>

<body class="rf-console rf-console-cal">
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
		<li><a href="index.php">HOME</a></li>
		<li><a href="datalogger.php">LOG</a></li>
		<li class="selected"><a href="cal.php">CAL</a></li>
		<li><a href="thrulan.php?id=0">Power Sensor</a></li>
		<li><a href="snmp_update.php">Rx SNMP Info</a></li>
		<li><a href="role.php?id=0">ROLE</a></li>
		<li><a href="network.php">NETWORK</a></li>
    <li><a href="wifi.php">WiFi</a></li>
		<li><a href="update.php">System</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASS.</a></li>
	</ul>
  </div>
</div>
<div id="site_content">
	<div class="cal-profile-wrapper">
		<h3 class="cal-page-title">CAL Profile</h3>
		<div class="cal-page-subtitle">Select a device card to open CAL page on its own IP.</div>
		<div class="device-card-grid" id="deviceCardGrid">
			<?php
			for ($i = 1; $i <= 12; $i++)
			{
					echo '<button type="button" class="device-card" id="cardTxId'.$i.'" onclick="openDeviceCal('.$i.')">';
				echo '  <div class="device-card-header">';
				echo '    <img class="device-card-icon" src="img/radioIcon.png" alt="Device '.$i.'">';
				echo '    <span class="device-status-badge" id="cardStatusId'.$i.'">Offline</span>';
				echo '  </div>';
				echo '  <div class="device-card-name" id="cardNameId'.$i.'">Device '.$i.'</div>';
				echo '  <div class="device-card-freq" id="cardFreqId'.$i.'">Frequency: -</div>';
				echo '  <div class="device-card-ip" id="cardIpId'.$i.'">IP: -</div>';
				echo '  <div class="device-card-action">Open CAL in new tab</div>';
					echo '</button>';
			}
			?>
		</div>
	</div>
</div>
</body>
</html>
