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
  <title>iRptCtrl</title>
  <meta name="description" content="Professional Audio Streamer" />
  <meta name="keywords" content="Audio Streamer, Music Streamer" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionMonitor.js"></script>
  <style type="text/css">
  
/*
  .selected_list {
}
*/
  </style>
</head>
</style>

<body>
  <div id="main">
    <div id="header">
      <div id="logo">
        <div id="logo_text">
          <h1><a href="index.php"><span class="logo_colour">Repeater Controller</span></a></h1>
        </div>
      </div>
      <div id="menubar">
        <ul id="menu">
			<li><a href="index.php">HOME</a></li>
			<li class="selected"><a href="monitor.php">MONITOR</a></li>
			<li><a href="network.php">NETWORK</a></li>
			<li><a href="update.php">UPDATE</a></li>
			<li><a href="logout.php">LOGOUT</a></li>
			<li><a href="changepass.php">CHANGE PASS.</a></li>
<!--
          <li><a href="examples.html">Examples</a></li>
          <li><a href="page.html">A Page</a></li>
          <li><a href="another_page.html">Another Page</a></li>
          <li><a href="contact.html">Contact Us</a></li>
-->
        </ul>
      </div>
    </div>
    <div id="site_content">
      <div class="sidebar">
		<h3 align="left">System</h3>
		  
<!--		  CPU Usage-->
		<div class="subsystemdiv" ><span>CPU Usage</span></div>
		<div class="subsystemdiv2"><span  style="float: right" id="labelCpuUsage">100.0 %</span></div>
		<div class="systemdiv">
			<canvas id="myCanvasCPUUsage" width="180" height="5" style="border: 0px solid #000000;"></canvas>
		</div>
<!--		Memory Usage-->
		<div class="subsystemdiv" ><span>Memory Usage</span></div>
		<div class="subsystemdiv2"><span  style="float: right" id="labelMemUsage">100.0 %</span></div>
		<div class="systemdiv">
			<canvas id="myCanvasMemUsage" width="180" height="5" style="border: 0px solid #000000;"></canvas>
		</div>
		  
<!--		CPC Temp-->
		<div class="subsystemdiv" ><span>CPU Temperature</span></div>
		<div class="subsystemdiv2"><span  style="float: right" id="labelCpuTemp">100.0 °C</span></div>
		<div class="systemdiv">
			<canvas id="myCanvasCpuTemp" width="180" height="5" style="border: 0px solid #000000;"></canvas>
		</div>
		  
<!--		CPC Temp-->
		<div class="subsystemdiv" ><span>Radio Temperature</span></div>
		<div class="subsystemdiv2"><span  style="float: right" id="labelHWTemp">100.0 °C</span></div>
		<div class="systemdiv">
			<canvas id="myCanvasHWTemp" width="180" height="5" style="border: 0px solid #000000;"></canvas>
		</div>
		  
<!--		Storge-->
		<div class="subsystemdiv" ><span>Storage</span></div>
		<div class="subsystemdiv2"><span  style="float: right" id="labelStorageUsed">16.0 GB</span></div>
		<div class="systemdiv">
			<canvas id="myCanvasStorageUsed" width="180" height="5" style="border: 0px solid #000000;"></canvas>
		</div>		  
		  
		
<!--         insert your sidebar items here -->
        
      </div>
      <div id="monitor_content" >
		  <h3 align="center">RF Input - Output Level</h3>
	    <div class="showLevelDiv">
			  <myLabelLeft2>RF Out (Watt)</myLabelLeft><br> 
			  <myLabelLeft id='fwd'>50</myLabelLeft><br>
			  <div class="systemdiv">
				  <canvas class="canvasdiv" id="myCanvasfwd" width="220px" height="8" style="border: 0px solid #000000;"></canvas>
			  </div>
		  </div>
	    <div class="showLevelDiv">
			  <myLabelLeft2>RF In (dBm)</myLabelLeft><br>
			  <myLabelLeft id='rssi'>0</myLabelLeft><br>
			  <div class="systemdiv">
				  <canvas class="canvasdiv" id="myCanvasrssi" width="220px" height="8" style="border: 0px solid #000000;"></canvas>
			  </div>
		  </div>
		  
	    <div class="showLevelDiv">
			  <myLabelLeft2>Voltage Level (Volt)</myLabelLeft><br>
			  <myLabelLeft id='vInRadio'>20</myLabelLeft><br>
			  <div class="systemdiv">
				  <canvas class="canvasdiv" id="myCanvasvInRadio" width="220px" height="8" style="border: 0px solid #000000;"></canvas>
			  </div>
		  </div>
		  
	  </div>
		
<!--
	<div class="sidebar2">

    </div>
-->
    
  </div>
<div id="footer">
      <h4>IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.</h4>
</div>
</body>
</html>
