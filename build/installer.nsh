!macro customRemoveFiles
  StrCpy $R0 "$PLUGINSDIR\biome-seeds-backup"
  StrCpy $R1 "$PLUGINSDIR\biome-hf-cache-backup"

  ${if} ${isUpdated}
    DetailPrint "Upgrade detected: preserving custom seeds and Hugging Face cache."

    RMDir /r "$R0"
    RMDir /r "$R1"

    IfFileExists "$INSTDIR\world_engine\seeds\uploads\*" 0 +2
      Rename "$INSTDIR\world_engine\seeds\uploads" "$R0"
    IfFileExists "$INSTDIR\world_engine\.cache\huggingface\hub\*" 0 +2
      Rename "$INSTDIR\world_engine\.cache\huggingface\hub" "$R1"

    # Keep standard upgrade behavior: remove previous install before reinstalling.
    RMDir /r "$INSTDIR"

    IfFileExists "$R0\*" 0 +3
      CreateDirectory "$INSTDIR\world_engine\seeds"
      Rename "$R0" "$INSTDIR\world_engine\seeds\uploads"

    IfFileExists "$R1\*" 0 +4
      CreateDirectory "$INSTDIR\world_engine\.cache"
      CreateDirectory "$INSTDIR\world_engine\.cache\huggingface"
      Rename "$R1" "$INSTDIR\world_engine\.cache\huggingface\hub"
  ${else}
    # Keep user-imported custom seeds across a full uninstall.
    RMDir /r "$R0"
    IfFileExists "$INSTDIR\world_engine\seeds\uploads\*" 0 +2
      Rename "$INSTDIR\world_engine\seeds\uploads" "$R0"

    # Remove installed files, including model/cache directories.
    RMDir /r "$INSTDIR"

    # Restore custom seeds if they were backed up.
    IfFileExists "$R0\*" 0 +3
      CreateDirectory "$INSTDIR\world_engine\seeds"
      Rename "$R0" "$INSTDIR\world_engine\seeds\uploads"
  ${endif}
!macroend
