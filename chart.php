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
  <title>IFZ Multi-coupler</title>
  <meta name="description" content="4 Wire to ED-137 Converter" />
  <meta name="keywords" content="ED137, SIP" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type="text/javascript" src="myfunctionChart.js"></script>
  <script type="text/javascript" src="canvasjs.min.js"></script>
<!--  <script type="text/javascript" src="countUp.js"></script>-->
  
  <script type = "text/javascript">
	  
  </script>
</head>
<script type="text/javascript">
window.onload = function(){
	plotChart();
}	
<?php
  $query = "SELECT timestamp as x,inputLevel as y, outputLevel as y2 FROM dataLogger WHERE recordType='5min' ORDER BY timestamp DESC LIMIT 20000";
  echo 'var chartText = "RF Input/Output Level";';
  echo 'var y1Name = "Input Level";';
  echo 'var y2Name = "Output Level";';
  echo 'var axisYTitle = "dBm";';
  if(isset($_POST['plot'])){    
	  $command = $_POST['chartID'];
	  if ($command == '1'){
	 	  $query = "SELECT timestamp as x,inputLevel as y, outputLevel as y2 FROM dataLogger WHERE recordType='5min' ORDER BY timestamp DESC LIMIT 20000";
		  echo 'var chartText = "RF Input/Output Level";';
		  echo 'var y1Name = "Input Level";';
  		  echo 'var y2Name = "Output Level";';
		  echo 'var axisYTitle = "dBm";';
	  }
	  else if ($command == '2'){
		  $query = "SELECT timestamp as x,lna_a_gain as y, lna_b_gain as y2 FROM dataLogger WHERE recordType='5min' ORDER BY timestamp DESC LIMIT 20000"; 
		  echo 'var chartText = "Low noise amplifier gain";';
		  echo 'var y1Name = "LNA-A Gain";';
  		  echo 'var y2Name = "LNA-B Gain";';
		  echo 'var axisYTitle = "dB";';
	  }
	  else if ($command == '3'){
		  $query = "SELECT timestamp as x,lna_a_current as y, lna_b_current as y2 FROM dataLogger WHERE recordType='5min' ORDER BY timestamp DESC LIMIT 20000"; 
		  echo 'var chartText = "Low noise amplifier current";';
		  echo 'var y1Name = "LNA-A Current";';
  		  echo 'var y2Name = "LNA-B Current";';
		  echo 'var axisYTitle = "mA";';
	  }
	  else if ($command == '4'){
		  $query = "SELECT timestamp as x,lna_a_voltage as y, lna_b_voltage as y2 FROM dataLogger WHERE recordType='5min' ORDER BY timestamp DESC LIMIT 20000"; 
		  echo 'var chartText = "Low noise amplifier voltage";';
		  echo 'var y1Name = "LNA-A Voltage";';
  		  echo 'var y2Name = "LNA-B Voltage";';
		  echo 'var axisYTitle = "V";';
	  }
	  else if ($command == '5'){
		  $query = "SELECT timestamp as x,cpu_temp as y, hwTemp as y2 FROM dataLogger WHERE recordType='5min' ORDER BY timestamp DESC LIMIT 20000"; 
		  echo 'var chartText = "Temperature";';
		  echo 'var y1Name = "CPU Temperature";';
  		  echo 'var y2Name = "Internal Temperature";';
		  echo 'var axisYTitle = "°C";';
	  }
	  else if ($command == '6'){
		  $query = "SELECT timestamp as x,cpu_usage as y, mem_usage as y2 FROM dataLogger WHERE recordType='5min' ORDER BY timestamp DESC LIMIT 20000"; 
		  echo 'var chartText = "CPU & Memory Usage";';
		  echo 'var y1Name = "CPU Usage";';
  		  echo 'var y2Name = "Memory Usage";';
		  echo 'var axisYTitle = "%";';
	  }
	  else if ($command == '7'){
		  $query = "SELECT timestamp as x,internal_voltage as y, external_voltage as y2 FROM dataLogger WHERE recordType='5min' ORDER BY timestamp DESC LIMIT 20000"; 
		  echo 'var chartText = "Supply Voltage";';
		  echo 'var y1Name = "Internal PSU Voltage";';
  		  echo 'var y2Name = "Ext-PSU Voltage";';
		  echo 'var axisYTitle = "Volt";';
	  }
   }
?>
function plotChart() {

<?php
$dataPoints = array();
$dataPoints2 = array();
//Best practice is to create a separate file for handling connection to database
try{
     // Creating a new connection.
    // Replace your-hostname, your-db, your-username, your-password according to your database
    $link = new \PDO(   'mysql:host=localhost;dbname=multiCoupler;charset=utf8mb4', //'mysql:host=localhost;dbname=canvasjs_db;charset=utf8mb4',
                        'datauser', //'root',
                        'ifz8zean6969**', //'',
                        array(
                            \PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                            \PDO::ATTR_PERSISTENT => false
                        )
                    );
    $handle = $link->prepare($query); 
	$query = "";
//    $handle = $link->prepare("SELECT date as x,cpu_temp as y, hwTemp as y2 FROM dataLogger WHERE recordType='24Hr' ORDER BY date DESC LIMIT 20000"); 
    $handle->execute(); 
    $result = $handle->fetchAll(\PDO::FETCH_OBJ);
    foreach($result as $row){
		$d2 = new DateTime($row->x);
		$d3 = strtotime($d2->format('Y-m-d H:i:sP'));
		array_push($dataPoints, array("x"=> $d3*1000, "y"=> $row->y));
        array_push($dataPoints2, array("x"=> $d3*1000, "y"=> $row->y2));
    }
	$link = null;
}
catch(\PDOException $ex){
    print($ex->getMessage());
}
	
?>

var chart = new CanvasJS.Chart("chartContainer",
{
  theme: "dark1",
  backgroundColor: "#00000000",
  animationEnabled: true, 
  animationDuration: 500,
  title:{
  text: chartText
  },
  axisY:{
      title:axisYTitle,
  },
  data: [
  {
	  type: "line", //change type to bar, line, area, pie, etc  
	  color: "#FA057E",
	  name: y1Name,
	  showInLegend: true,
	  xValueFormatString: "HH:mm DD-MMM",
	  xValueType: "dateTime",
	  dataPoints: <?php echo json_encode($dataPoints, JSON_NUMERIC_CHECK); ?>,
  },
  {
	  type: "line", //change type to bar, line, area, pie, etc  
	  color: "#fcff4d",
	  name: y2Name,
	  showInLegend: true,
	  xValueFormatString: "HH:mm DD-MMM",
	  xValueType: "dateTime",
	  dataPoints: <?php echo json_encode($dataPoints2, JSON_NUMERIC_CHECK); ?>,
  }
  ]
});
chart.render();
}
</script>
<body>
<div id="header">
  <div id="logo">
	<div id="logo_text">
      <h1><a href="index.php"><span class="logo_colour">VHF Multi-coupler</span></a></h1>
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
		<li><a href="monitor.php">MONITOR</a></li>
		<li class="selected"><a href="chart.php">DATA LOG.</a></li>
		<li><a href="network.php">NETWORK</a></li>
		<li><a href="update.php">SYSTEM CONF.</a></li>
<!--		<li><a href="rfmetercal.php">RF CAL.</a></li>-->
		<li><a href="logout.php">LOGOUT</a></li>
		<li><a href="changepass.php">CHANGE PASS.</a></li>		
	</ul>
  </div>
</div>
  <div id="site_content">
	  <h3 align="center">Data Loggers</h3><br>
      <div class="chartDiv">
        
	  <form method="post" action="">
		<div class="sampleselected">
<!--		  <select name="chartID"  class="systemselect" id="chartID" onChange="plotChart()">-->
		  <select name="chartID"  class="systemselect" id="chartID">
        		<option class='selectedlt' selected value='0'>Select Data</option>
				<option class='selectedlt' value='1'>RF Level</option>
				<option class='selectedlt' value='2'>LNA Gain</option>
			  	<option class='selectedlt' value='3'>LNA Current</option>
			  	<option class='selectedlt' value='4'>LNA Voltage</option>
			  	<option class='selectedlt' value='5'>Temperature</option>
			  	<option class='selectedlt' value='6'>CPU and Memory</option>
			  	<option class='selectedlt' value='7'>PSU Voltage</option>
	  	  </select>
		</div>
		<div class="sampleselected">
			<button class="button button2" type="submit" id="plot" name="plot";>Apply</button>
	    </div><br><br>
	  </form>
      </div>
	  <br>
  	  <div id="chartContainer" style="height: 300px; width: 100%; float: left;"></div>
  </div>

<div id="footer">
      <h4>IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.</h4>
</div>
</body>
</html>
