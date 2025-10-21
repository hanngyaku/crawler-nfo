import fs from "fs";
import  FunctionTools  from "../tools/functions.js";
function MoveTest() {
    var txtName = 'D:\\桌面文件夹\\修仙\\新建 文本文档.txt';
    var newtxtName = 'D:\\桌面文件夹\\修仙\\2.txt';
    fs.rename(txtName, newtxtName, (err) => console.log(err));
}

function FindFiles() {
    var dir = 'D:\\Jellyfin\\Media\\#整理完成';
    var results = FunctionTools.findFilesBySuffix(dir, ['.mp4', '.png', '.jpg']);
    console.log(results);
}

FindFiles();