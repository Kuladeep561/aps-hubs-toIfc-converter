import { initViewer, loadModel } from './viewer.js';
import { initTree } from './sidebar.js';
import { translateToIfc } from './to-ifc.js'

let viewer
let data = new FormData();
const login = document.getElementById('login');
try {
    const resp = await fetch('/api/auth/profile');
    if (resp.ok) {
        const user = await resp.json();
        login.innerText = `Logout (${user.name})`;
        login.onclick = () => {
            const iframe = document.createElement('iframe');
            iframe.style.visibility = 'hidden';
            iframe.src = 'https://accounts.autodesk.com/Authentication/LogOut';
            document.body.appendChild(iframe);
            iframe.onload = () => {
                window.location.replace('/api/auth/logout');
                document.body.removeChild(iframe);
            };
        }
        viewer = await initViewer(document.getElementById('preview'));
        initTree('#tree', (id, derivativesId) => {
            data.set('urn', derivativesId)
            loadModel(viewer, window.btoa(id).replace(/=/g, ''));
        });

    } else {
        login.innerText = 'Login';
        login.onclick = () => window.location.replace('/api/auth/login');
    }
    login.style.visibility = 'visible';
} catch (err) {
    alert('Could not initialize the application. See the console for more details.');
    console.error(err);
}

const contextMenu = new VanillaContextMenu({
    scope: document.querySelector('#tree'), 
    menuItems: [
      {
        label: 'to-ifc',
        callback: async () => {
          await translateToIfc(data, viewer);
        },
      },
    ],
    customThemeClass: 'custom-context-menu-theme',
    customClass: 'custom-context-menu'
});
  
