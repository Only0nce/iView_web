<?php
header("Content-type:application/json; charset=UTF-8");    
header("Cache-Control: no-store, no-cache, must-revalidate");         
header("Cache-Control: post-check=0, pre-check=0", false); 
require_once("dbconnect.php");
$id = 0;
$command = "";
if((isset($_GET['cmmd']) && $_GET['cmmd']!=""))
{
	$json = $_GET['cmmd'];
	$obj = json_decode($json, true);
	if ($obj['dhcp'] == "0")
		$dhcp = "off";
	else
		$dhcp = "on";
	$ipaddress = $obj['ipaddress'];
	$subnet = $obj['subnet'];
	$gateway = $obj['gateway'];
	$dns1 = $obj['dns1'];
	$dns2 = $obj['dns2'];
	if ($subnet == "") $subnet = '24';
	
	$sql = "UPDATE network SET dhcp='".$dhcp."', ipaddress='".$ipaddress."', subnet='".$subnet."', gateway='".$gateway."', dns1='".$dns1."', dns2='".$dns2."'";
	if ($dhcp == "0") $dhcp = "off";
	if ($dhcp == "1") $dhcp = "on";
	if ($dhcp == 'on'){
		exec('sudo setnetwork.py -d '.$dhcp.' ');
		$sql = "UPDATE network SET dhcp='".$dhcp."', ipaddress='".""."', subnet='".""."', gateway='".""."', dns1='".""."', dns2='".""."'";
		$mysqli->query($sql);
	}
	
	else if (($ipaddress != "") && ($subnet != "") && ($gateway != "") && ($dns1 != "") && ($dns2 != "")){
		exec('sudo setnetwork.py -d '.$dhcp.' -i '.$ipaddress.' -s '.$subnet.' -g '.$gateway.' -P '.$dns1.' -S '.$dns2.' ');
		$mysqli->query($sql);
	}
	else if (($ipaddress != "") && ($subnet != "") && ($gateway != "") && ($dns1 != "") && ($dns2 == "")){
		exec('sudo setnetwork.py -d '.$dhcp.' -i '.$ipaddress.' -s '.$subnet.' -g '.$gateway.' -P '.$dns1.' ');
		$mysqli->query($sql);
	}
	else if (($ipaddress != "") && ($subnet != "") && ($gateway != "") && ($dns1 == "") && ($dns2 != "")){
		exec('sudo setnetwork.py -d '.$dhcp.' -i '.$ipaddress.' -s '.$subnet.' -g '.$gateway.' -P '.$dns2.' ');
		$sql = "UPDATE network SET dhcp='".$dhcp."', ipaddress='".$ipaddress."', subnet='".$subnet."', gateway='".$gateway."', dns1='".$dns2."', dns2='".""."'";
		$mysqli->query($sql);
	}
	else if (($ipaddress != "") && ($subnet != "") && ($gateway != "") && ($dns1 == "") && ($dns2 == "")){
		exec('sudo setnetwork.py -d '.$dhcp.' -i '.$ipaddress.' -s '.$subnet.' -g '.$gateway.' ');
		$mysqli->query($sql);
	}
	else if (($ipaddress != "") && ($subnet != "") && ($gateway == "")){
		exec('sudo setnetwork.py -d '.$dhcp.' -i '.$ipaddress.' -s '.$subnet.' ');
		$sql = "UPDATE network SET dhcp='".$dhcp."', ipaddress='".$ipaddress."', subnet='".$subnet."', gateway='".$gateway."', dns1='".""."', dns2='".""."'";
		$mysqli->query($sql);
	}
	
    
	
}
$mysqli->close();
$mysqli = null;


	
// แปลง array เป็นรูปแบบ json string  

$json_data[] = array(
			"command" => "update network",
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

