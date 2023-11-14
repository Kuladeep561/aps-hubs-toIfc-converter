import { BaseExtension } from "./BaseExtension.js";
import { viewer, data } from "../main.js";
import { translateToIfc } from "./js/to-ifc.js";

class ifcConverterExtension extends BaseExtension {
  constructor(viewer, options) {
    super(viewer, options);
    this._button = null;
  }

  load() {
    super.load();
    console.log("ifcConverterExtension is loaded");
    return true;
  }

  unload() {
    super.unload();
    if (this._button) {
      this.removeToolbarButton(this._button);
      this._button = null;
    }
    console.log("ifcConverterExtension i sunloaded");
    return true;
  }

  onToolbarCreated() {
    this._button = this.createToolbarButton(
      "ifcConverter-button",
      "https://f3h3w7a5.rocketcdn.me/wp-content/uploads/2019/01/cropped-favicon.png",
      "Convert the rvt model to Ifc"
    );
    this._button.onClick = async () => {
      await translateToIfc(data, viewer);
    };
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  "EDD.IfcConverter",
  ifcConverterExtension
);
