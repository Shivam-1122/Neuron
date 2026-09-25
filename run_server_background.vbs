Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = ScriptDir
cmd = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ScriptDir & "\run_persistent_services.ps1"""
WshShell.Run cmd, 0, False
