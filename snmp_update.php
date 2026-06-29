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
	require_once __DIR__ . '/hardware_features.php';
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
  <script type="text/javascript" src="snmp.js?v=<?php echo time(); ?>"></script>
<!--  <script type="text/javascript" src="countUp.js"></script>-->
  
  <script type = "text/javascript">
	  
  </script>
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
		<li><a href="cal.php?id=1">CAL</a></li>
		<li><a href="thrulan.php?id=0">Power Sensor</a></li>
		<li class="selected"><a href="snmp_update.php">Rx SNMP Info</a></li>
		<li><a href="role.php?id=0">ROLE</a></li>
		<li><a href="network.php">NETWORK</a></li>
                <?php echo iview_render_wifi_menu_item(false); ?>
<li><a href="update.php">System</a></li>
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASS.</a></li>
	</ul>
  </div>
</div>
  <div id="site_content">
        
		<?php
		$newid = -1;
		if(isset($_GET['id']))
			$newid = intval($_GET['id']);
		if(isset($_POST['id']))
			$newid = intval($_POST['id']);

	if(isset($_POST['system']))
	{    
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
	if ($newid >= 0)
	{
			echo '<script language="javascript">';
		  echo 'window.addEventListener("DOMContentLoaded", function(){ setCurrentID('.$newid.'); });';
		  echo '</script>';
	}
	?>

	
<div class="container">
<h3 class="truelanLabel" id="newtruelan" name="newtruelan" >New SNMP Profile</h3>
</div>
<div class="container6">
		<div class="card" id="card0" name="card0" style="display: block; background-color: rgba(0, 0, 0, 0.0)">
			<?php	
				
				echo '<div class="cardTxTab" id="cardTxNew" name="cardTxNew" onclick="setCurrentID(-1)" style="display: block; background-color:rgba(0,0,0,0.3)">';
				echo '<img class="cardTxTabImage" src="img/newRadio.png" alt="Flowers in Chania">';
				echo '<span class="cardTxTabText3" id="cardNameIdNew" name="cardNameIdNew"> New </span>';
				echo '</div>';
			?>
		</div>
</div>


	<div class="container7">
		<div class="card" id="card" name="card" style="display: block; background-color: rgba(0, 0, 0, 0.0)">
			<div class="selected_list" style="display: show"> <span>Device Name</span>
			<input class="form-control" type="text" id="deviceName" name="deviceName"  placeholder="Device Name" value=''/>			
			</div>
			<div class="selected_list" style="display: show"> <span>SNMP Community</span>
			<input class="form-control" type="text" id="snmpCommunity" name="snmpCommunity"  placeholder="Default: public" value='public'/>			
			</div>
			<div class="selected_list" style="display: show"> <span>SNMP Port</span>
			<input class="form-control" type="text" id="snmpPort" name="snmpPort"  placeholder="Default: 161" value='161'/>			
			</div>
			<div class="selected_list" style="display: show"> <span>Poll Interval (ms)</span>
			<input class="form-control" type="text" id="pollInterval" name="pollInterval"  placeholder="Example: 2000 = poll every 2 seconds" value='2000'/>			
			</div>
			<div class="selected_list" style="display: show"> <span>OID Frequency</span>
			<input class="form-control" type="text" id="oid_freq" name="oid_freq"  placeholder="OID Frequency" value=''/>			
			</div>
			<div class="selected_list" style="display: show"> <span>OID RSSI</span>
			<input class="form-control" type="text" id="oid_rssi" name="oid_rssi"  placeholder="OID RSSI" value=''/>					
			</div>
			<div class="selected_list" style="display: show"> <span>OID Radio Status</span>
			<input class="form-control" type="text" id="oid_radiostatus" name="oid_radiostatus"  placeholder="OID Radio Status" value=''/>					
			</div>
			<div class="selected_list" style="display: show"> <span>OID Radio SQL Level</span>
			<input class="form-control" type="text" id="oid_sqllevel" name="oid_sqllevel"  placeholder="OID Radio SQL Level" value=''/>					
			</div>
			<div class="selected_list" style="display: show"><span></span>
			<button class="button button2" id="newtruelanbutton" onClick="updateTrueLan()">NEW</button>
			</div>
			<div class="selected_list" style="display: show"><span></span>
			<button class="button button2" id="deletetruelanbutton" onClick="deleteTrueLan()" style="display: none; background-color: #ff2222aa; ">REMOVE</button>
			</div>
			<div class="selected_list" style="display: show"><span></span>
			<button class="button button2" id="exportsnmpbutton" onClick="exportSnmpProfiles()">EXPORT</button>
			</div>
			<div class="selected_list" style="display: show"><span></span>
			<button class="button button2" id="importsnmpbutton" onClick="openSnmpImportFile()">IMPORT</button>
			<input class="form-control" type="file" id="snmpImportFile" accept=".json,application/json" style="display: none" onchange="importSnmpProfiles(event)" />
			</div>
	  </div>
	</div>
</div>


</body>
</html>
