!macro customRemoveFiles
  StrCpy $R1 "$PLUGINSDIR\biome-hf-cache-backup"

  ${if} ${isUpdated}
    DetailPrint "Upgrade detected: preserving Hugging Face cache."

    RMDir /r "$R1"

    IfFileExists "$INSTDIR\world_engine\.cache\huggingface\hub\*" 0 +2
      Rename "$INSTDIR\world_engine\.cache\huggingface\hub" "$R1"

    # Keep standard upgrade behavior: remove previous install before reinstalling.
    RMDir /r "$INSTDIR"

    IfFileExists "$R1\*" 0 +4
      CreateDirectory "$INSTDIR\world_engine\.cache"
      CreateDirectory "$INSTDIR\world_engine\.cache\huggingface"
      Rename "$R1" "$INSTDIR\world_engine\.cache\huggingface\hub"
  ${else}
    # Remove installed files, including model/cache directories.
    RMDir /r "$INSTDIR"
  ${endif}
!macroend
