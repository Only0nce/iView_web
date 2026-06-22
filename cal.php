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
  <title>iView RF Power Monitor - CAL Profile</title>
  <meta name="description" content="iView RF Power Monitor CAL profile" />
  <meta name="keywords" content="iView RF Power Monitor, CAL, THRULAN, RF Power Sensor" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <link rel="stylesheet" type="text/css" href="rf-console.css?v=<?php echo time(); ?>" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="cal.js?v=<?php echo time(); ?>"></script>
  <script type="text/javascript" src="rf-theme.js?v=<?php echo time(); ?>"></script>
</head>

<body class="rf-console rf-console-cal">
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
  <div id="menubar" role="navigation" aria-label="Primary navigation">
	<ul id="menu">
		<li><a href="index.php">HOME</a></li>
		<li><a href="datalogger.php">LOG</a></li>
		<li class="selected"><a href="cal.php">CAL</a></li>
		<li><a href="thrulan.php?id=0">Power Sensor</a></li>
		<li><a href="snmp_update.php">Rx SNMP Info</a></li>
		<li><a href="role.php?id=0">SITE</a></li>
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
		<div class="cal-page-head">
			<div>
				<h3 class="cal-page-title">CAL Profile</h3>
				<div class="cal-page-subtitle">Select a device card to open CAL page on its own IP.</div>
			</div>
			<div class="cal-page-count" aria-label="CAL device capacity">12 Devices</div>
		</div>
		<div class="device-card-grid" id="deviceCardGrid">
			<?php
			for ($i = 1; $i <= 12; $i++)
			{
				echo '<button type="button" class="device-card" id="cardTxId'.$i.'" data-device-index="'.$i.'" onclick="openDeviceCal('.$i.')" aria-label="Open CAL for device '.$i.'">';
				echo '  <div class="device-card-visual" aria-hidden="true">';
				echo '    <img class="device-card-image" src="/img/Thrulan.png" alt="" loading="lazy" onerror="this.parentElement.classList.add(&#39;no-device-image&#39;);this.remove();">';
				echo '    <div class="device-card-placeholder">';
				echo '      <span>CAL</span>';
				echo '    </div>';
				echo '    <span class="device-status-badge" id="cardStatusId'.$i.'">Offline</span>';
				echo '  </div>';
				echo '  <div class="device-card-body">';
				echo '    <div class="device-card-kicker">Device '.$i.'</div>';
				echo '    <div class="device-card-title-row">';
				echo '      <div class="device-card-name" id="cardNameId'.$i.'">Device '.$i.'</div>';
				echo '      <span class="device-card-arrow" aria-hidden="true">›</span>';
				echo '    </div>';
				echo '    <div class="device-card-meta">';
				echo '      <div class="device-card-freq" id="cardFreqId'.$i.'">Frequency: -</div>';
				echo '      <div class="device-card-ip" id="cardIpId'.$i.'">IP: -</div>';
				echo '    </div>';
				echo '    <div class="device-card-action">Open CAL in new tab</div>';
				echo '  </div>';
				echo '</button>';
			}
			?>
		</div>
	</div>
</div>
</body>
</html>
