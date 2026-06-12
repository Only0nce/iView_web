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
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="cal.js?v=<?php echo time(); ?>"></script>
  <style>
    .cal-profile-wrapper {
      width: 100%;
      max-width: 1200px;
      margin: 20px auto 0;
      padding: 0 12px 24px;
      box-sizing: border-box;
    }

    .cal-page-title {
      margin: 0;
      text-align: center;
      color: #ff1493;
      letter-spacing: 1px;
      font-size: 42px;
      text-transform: uppercase;
    }

    .cal-page-subtitle {
      margin: 10px 0 22px;
      text-align: center;
      color: #d4d8e6;
      font-size: 19px;
    }

    .device-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 14px;
    }

    .device-card {
      display: none;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(160deg, rgba(5, 13, 34, 0.9), rgba(16, 37, 70, 0.88));
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
      min-height: 190px;
    }

    .device-card:hover {
      transform: translateY(-4px);
      border-color: rgba(0, 245, 255, 0.45);
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.36);
    }

    .device-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .device-card-icon {
      width: 70px;
      height: 40px;
      object-fit: contain;
    }

    .device-status-badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.8px;
      background: rgba(255, 0, 0, 0.2);
      color: #ffb3b3;
      border: 1px solid rgba(255, 120, 120, 0.4);
    }

    .device-card.connected .device-status-badge {
      background: rgba(18, 197, 94, 0.2);
      color: #b8ffd5;
      border-color: rgba(62, 255, 146, 0.5);
    }

    .device-card-name {
      color: #ffffff;
      font-size: 21px;
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 8px;
      word-break: break-word;
    }

    .device-card-freq,
    .device-card-ip {
      color: #c7ccdb;
      font-size: 15px;
      line-height: 1.3;
      margin-bottom: 6px;
      word-break: break-word;
    }

    .device-card-action {
      margin-top: 12px;
      font-size: 14px;
      color: #83fff6;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .cal-page-title {
        font-size: 32px;
      }

      .cal-page-subtitle {
        font-size: 16px;
      }
    }
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
				echo '<div class="device-card" id="cardTxId'.$i.'" onclick="openDeviceCal('.$i.')">';
				echo '  <div class="device-card-header">';
				echo '    <img class="device-card-icon" src="img/radioIcon.png" alt="Device '.$i.'">';
				echo '    <span class="device-status-badge" id="cardStatusId'.$i.'">Offline</span>';
				echo '  </div>';
				echo '  <div class="device-card-name" id="cardNameId'.$i.'">Device '.$i.'</div>';
				echo '  <div class="device-card-freq" id="cardFreqId'.$i.'">Frequency: -</div>';
				echo '  <div class="device-card-ip" id="cardIpId'.$i.'">IP: -</div>';
				echo '  <div class="device-card-action">Open CAL in new tab</div>';
				echo '</div>';
			}
			?>
		</div>
	</div>
</div>
</body>
</html>
