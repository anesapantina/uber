// Web font loader for react-native-vector-icons
if (typeof document !== 'undefined') {
  const iconFontStyles = `
    @font-face {
      font-family: 'Ionicons';
      src: url('https://unpkg.com/ionicons@5.5.2/dist/fonts/ionicons.woff2') format('woff2'),
           url('https://unpkg.com/ionicons@5.5.2/dist/fonts/ionicons.woff') format('woff'),
           url('https://unpkg.com/ionicons@5.5.2/dist/fonts/ionicons.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'MaterialIcons';
      src: url('https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IumQp41pf8BGVY4EMW3qPfA.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }
  `;
  
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(iconFontStyles));
  document.head.appendChild(style);
}
