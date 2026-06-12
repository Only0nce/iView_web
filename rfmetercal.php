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
	$webversion = "V2.1.1"
?>
<!DOCTYPE HTML>
<?php
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');
ini_set('max_input_time', 300);
ini_set('max_execution_time', 300);
include('dbConfig.php');
include('timezone.php')
?>
	
<html>
<head>
  <title>IFZ Multi-coupler</title>
  <meta name="description" content="Professional Audio Streamer" />
  <meta name="keywords" content="Audio Streamer, Music Streamer" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionRfCal.js"></script>
  <link rel="stylesheet" type="text/css" href="jquery.datetimepicker.css">
  <script type="text/javascript" src="jquery.js"></script>
  <script type="text/javascript" src="jquery.datetimepicker.js"></script>
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
          <!-- class="logo_colour", allows you to change the colour of the text -->
          <h1><a href="index.php"><span class="logo_colour">VHF Multi-coupler</span></a></h1>
<!--          <h2>IFZ Technologies Co.,Ltd.</h2>-->
        </div>
      </div>
      <div id="menubar">
        <ul id="menu">
			<li><a href="index.php">HOME</a></li>
			<li><a href="monitor.php">MONITOR</a></li>
			<li><a href="chart.php">DATA LOG.</a></li>
			<li><a href="network.php">NETWORK</a></li>
			<li><a href="update.php">SYSTEM CONF.</a></li>
			<li class="selected"><a href="rfmetercal.php">RF CAL.</a></li>
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
      </div>
      <div id="network_content">
        <!-- insert the page content here -->
        <h3 align="center">RF Power Meter Calibration</h3>
		<div class="selected_list"> 
		 <h4 align="center">RF Input</h4>
		  </div>
		<div class="selected_list"> 
			<span id="inputMinLabel">Input Level Min</span>
			<input class="form-control" type="number" id="inputMinCal" name="inputMinCal" min="-60" max="30" placeholder="" step="0.1" value='-30.0'/>
		</div>
		<div class="selected_list"><span></span>
			<button class="button button2" onClick="updateInputMin()">Update input min.</button>
		</div>
		<div class="selected_list"> 
			<span id="inputMaxLabel">Input Level Max</span>
			<input class="form-control" type="number" id="inputMaxCal" name="inputMaxCal" min="-60" max="30" placeholder="" step="0.1" value='0.0'/>
		</div>
		<div class="selected_list"><span></span>
			<button class="button button2" onClick="updateInputMax()">Update input max.</button>
		</div>
		  
		 <div class="selected_list"> 
		 <h4 align="center">RF Output</h4>
		  </div>
		<div class="selected_list"> 
			<span id="outputMinLabel">Output Level Min</span>
			<input class="form-control" type="number" id="outputMinCal" name="outputMinCal" min="-60" max="30" placeholder="" step="0.1" value='-30.0'/>
		</div>
		<div class="selected_list"><span></span>
			<button class="button button2" onClick="updateOutputMin()">Update input min</button>
		</div>
		<div class="selected_list"> 
			<span id="outputMaxLabel">Output Level Max</span>
			<input class="form-control" type="number" id="outputMaxCal" name="outputMaxCal" min="-60" max="30" placeholder="" step="0.1" value='0.0'/>
		</div>
		<div class="selected_list"><span></span>
			<button class="button button2" onClick="updateOutputMax()">Update input max</button>
		</div>
		<div class="selected_list"> 
		 <h4 align="center">Please Apply to save data.</h4>
		  </div>
		<div class="selected_list"><span></span>
			<button class="button button2" onClick="updateRFCal()">APPLY</button>
		</div>
		</div>
	</div>
  </div>
  <div id="footer">
      <h4>IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.</h4>
</div>
</body>
</html>
