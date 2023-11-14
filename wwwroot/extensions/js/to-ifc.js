import { initViewer, loadModel } from "../../viewer.js";

let overlayVisible = false; // Keep track of the overlay visibility
let autoRefreshInterval; // Interval for auto-refresh

async function getJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(error);
    alert(
      "An error occurred while fetching data. See the console for more details."
    );
    return [];
  }
}

async function extractDerivativeUrnForIfc(responseBody) {
  const dData = responseBody.derivatives;
  const ifcDerivative = dData?.find((data) => data.outputType === "ifc");
  if (ifcDerivative) {
    const ifcChild = ifcDerivative.children.find(
      (child) => child.role === "ifc"
    );
    return ifcChild ? ifcChild.urn : null;
  }
  return null;
}

function showNotification(message) {
  const overlay = document.getElementById("overlay");
  overlay.innerHTML = `<div class="notification">${message}</div>`;
  overlay.style.display = "flex";
}

function showLoadingOverlay() {
  showNotification("Loading...");
  overlayVisible = true;
}

function clearNotification() {
  const overlay = document.getElementById("overlay");
  overlay.innerHTML = "";
  overlay.style.display = "none";
  overlayVisible = false;
  stopAutoRefresh();
}

function startAutoRefresh(viewer, urn) {
  autoRefreshInterval = setInterval(() => getManifest(viewer, urn), 40000); // Refresh every 65 seconds
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

async function getDerivativeManifest(urn, derivativeUrn) {
  try {
    const encodedDerivativeUrn = encodeURIComponent(derivativeUrn);
    const derivativeManifest = await getJSON(
      `/api/designdata/${urn}/manifest/${encodedDerivativeUrn}`
    );
    return derivativeManifest;
  } catch (error) {
    alert(
      "Could not fetch the derivative manifest. See the console for more details."
    );
    console.error(error);
  }
}

async function saveBinaryFile(response, fileName) {
  const blob = new Blob([response.body], { type: "application/octet-stream" });
  try {
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      document.body.appendChild(a);
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    alert("Could not save the file. See the console for more details.");
    console.error(error);
  }
}

async function getManifest(viewer, urn) {
  try {
    const status = await getJSON(`/api/designdata/${urn}/status`);
    console.log(status);

    switch (status.status) {
      case "n/a":
        showNotification("Model has not been translated.");
        break;
      case "pending":
      case "inprogress":
        showLoadingOverlay();
        showNotification(`Model is being translated (${status.progress})...`);
        break;
      case "failed":
        showNotification(`Translation failed. See console for more details.`);
        break;
      default:
        clearNotification();
        loadModel(viewer, urn);
        const derivativeUrn = await extractDerivativeUrnForIfc(status);

        if (derivativeUrn) {
          const filename = derivativeUrn.split("/").pop();
          const derivativeManifestResponse = await getDerivativeManifest(
            urn,
            derivativeUrn
          );

          if (derivativeManifestResponse) {
            saveBinaryFile(derivativeManifestResponse, filename);
          } else {
            alert("Not converted into IFC. Check Console for more details.");
          }
        }
    }
  } catch (error) {
    alert(
      "An error occurred while fetching the manifest. See the console for more details."
    );
    console.error(error);
  }
}

export async function translateToIfc(data, viewer) {
  if (!data) {
    alert("Please provide a URN for translation.");
    return;
  }

  try {
    const response = await fetch("/api/designdata/job", {
      method: "POST",
      body: data,
    });

    if (response.ok) {
      const jsonResponse = await response.json();
      if (jsonResponse.result === "success") {
        getManifest(viewer, jsonResponse.urn);
        startAutoRefresh(viewer, jsonResponse.urn);
      } else {
        alert("Translation failed. Check the console for more details.");
      }
    } else {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error(error);
    alert(
      "An error occurred during translation. See the console for more details."
    );
  }
}
