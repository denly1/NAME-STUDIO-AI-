!include "MUI2.nsh"

# Custom installer pages
!define MUI_ICON "assets\icon.ico"
!define MUI_UNICON "assets\icon.ico"

# Welcome page
!define MUI_WELCOMEPAGE_TITLE "Welcome to NAME STUDIO AI Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of NAME STUDIO AI - Your Premium AI-Powered Coding Assistant.$\r$\n$\r$\nNAME STUDIO AI features:$\r$\n• Advanced AI coding assistant$\r$\n• Multi-file project analysis$\r$\n• Intelligent code generation$\r$\n• Real-time collaboration$\r$\n• Beautiful modern interface$\r$\n$\r$\nClick Next to continue."

# Finish page
!define MUI_FINISHPAGE_TITLE "NAME STUDIO AI Installation Complete"
!define MUI_FINISHPAGE_TEXT "NAME STUDIO AI has been successfully installed on your computer.$\r$\n$\r$\nClick Finish to close this wizard."
!define MUI_FINISHPAGE_RUN "$INSTDIR\NAME STUDIO AI.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch NAME STUDIO AI"
!define MUI_FINISHPAGE_LINK "Visit our website"
!define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/denly1/NAME-STUDIO-AI-"

# Custom colors and branding
!define MUI_BGCOLOR "0F0C29"
!define MUI_TEXTCOLOR "FFFFFF"

# Progress bar colors
!define MUI_INSTALLCOLORS "667EEA 0F0C29"
