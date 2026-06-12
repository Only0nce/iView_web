<?php
header("Content-type:application/json; charset=UTF-8");    
header("Cache-Control: no-store, no-cache, must-revalidate");         
header("Cache-Control: post-check=0, pre-check=0", false); 
require_once("dbconnect.php");
$id = 0;
$command = "";
if((isset($_GET['addr']) && $_GET['addr']!=""))
{
	$serverAddress = $_GET['addr'];
	
	$sql = "UPDATE network SET serverAddress='".$serverAddress."'";
	$mysqli->query($sql);
}

if((isset($_GET['nodeID']) && $_GET['nodeID']!=""))
{
	$nodeID = $_GET['nodeID'];
	
	$sql = "UPDATE network SET nodeID='".$nodeID."'";
	$mysqli->query($sql);
}

$mysqli->close();
$mysqli = null;


	
// แปลง array เป็นรูปแบบ json string  

$json_data[] = array(
			"command" => "update serverAddress",
			"processed" => 1
        );

if(isset($json_data))
{  
//    $json = json_encode($json_data[0]);    
    if(isset($_GET['callback']) && $_GET['callback']!=""){    
    echo $_GET['callback']."(".$json.");";        
    }else{    
    echo $json;    
    }    
}
?>

