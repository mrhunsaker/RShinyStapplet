<?php
ini_set("include_path", '/home/whkobxnuf536/php:' . ini_get("include_path") );

$classcode = substr($_GET['c'], 0, 6);

// Include the package
require_once('Cache/Lite.php');

// Set a few options
$options = array(
    'cacheDir' => '/home/whkobxnuf536/cache/',
    'lifeTime' => 5
);

// Create a Cache_Lite object
$Cache_Lite = new Cache_Lite($options);

// check if lifetime should be extended
if ($loaddata = $Cache_Lite->get("server_load"))
    $Cache_Lite->setLifeTime(intval($loaddata));
else
{
    // check 5 min avg -- cache ranges from 5 to 15 seconds in lifetime
    $loadavg = sys_getloadavg()[1];
    $lifetime = ($loadavg < 1 ? 5 :
                    ($loadavg < 2 ? 10 : 15));
    $Cache_Lite->save("" . $lifetime, "server_load");
    $Cache_Lite->setLifeTime($lifetime);
}

// Test if thereis a valid cache for this id
if ($data = $Cache_Lite->get($classcode))
{
    echo $data;
} else { // No valid cache found (you have to make the page)

    include '_login.php';

    $tblPS = $pdo->prepare("SELECT * FROM tblMaster WHERE ClassCode = ?");
    $tblPS->execute([$classcode]);
    if ($tblPS->rowCount() > 0)
    {
        $tblparams = $tblPS->fetch();
        $isquant = ($tblparams["Quant"] == "1");
        $tblname = ($isquant ? "tblQuant" : "tblCat") . $tblparams["NumVar"] . "V";
        $is2var = ($tblparams["NumVar"] == "2");
        
        $pgstr = $tblparams["Enabled"] . $tblparams["Var1Name"] . ($is2var ?  "," . $tblparams["Var2Name"] : "") . "\n";
    
        $groupnames = [];
        if (!$is2var)
        {
            $groupPS = $pdo->prepare("SELECT GroupID, GroupName FROM tblGroupName WHERE ClassCode = ? ORDER BY GroupID");
            $groupPS->execute([$classcode]);
            foreach ($groupPS as $row)
            {
                while (count($groupnames) < (intval($row["GroupID"]) - 1))
                    $groupnames[] = "Group " . (count($groupnames) + 1);
                $groupnames[] = $row["GroupName"];          
            }
        }
    
        $dataPS = ($is2var ? $pdo->prepare("SELECT Var1, Var2 FROM " . $tblname . " WHERE ClassCode = ?") : $pdo->prepare("SELECT Var1, GroupID" . ($isquant ? "" : ", Frequency") . " FROM " . $tblname . " WHERE ClassCode = ?"));
    
        $dataPS->execute([$classcode]);
        
        if ($is2var)
            foreach ($dataPS as $row)
                $pgstr .= ($row["Var1"] . "," . $row["Var2"] . "\n");
        else
            foreach ($dataPS as $row)
            {
                $grpid = intval($row["GroupID"]);
                $grpname = (count($groupnames) < $grpid ? "Group " . $grpid : $groupnames[$grpid - 1]);
                $pgstr .= ($grpid . "," . $grpname . "," . $row["Var1"] . ($isquant ? "" : "," . $row["Frequency"]) . "\n");
            }
        
        $Cache_Lite->save($pgstr, $classcode);
        echo $pgstr;
    }
}
?>