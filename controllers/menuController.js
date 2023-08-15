import Menu from "../models/menu.js";
import Vendor from "../models/vendor.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export async function addMenuItem(req, res) {
  try {
    const { vendorID, name, dishType, description, price } = req.body;
    if (!vendorID || !name || !dishType || !description || !price) {
      return res
        .status(400)
        .json({ message: "Please enter all the required fields" });
    }
    const image = req.file;
    const result = await cloudinary.uploader.upload(image.path, {
      width: 500,
      height: 500,
      crop: "scale",
      quality: 50,
    });

    const vendorExists = await Vendor.findById(vendorID);
    if (vendorExists) {
      const menuItem = await Menu.create({
        vendorID,
        vendorName: vendorExists.name,
        name,
        dishType,
        description,
        price,
        image: result.secure_url,
      });
      res.status(201).json({
        _id: menuItem.id,
        vendorID: menuItem.vendorID,
        vendorName: menuItem.vendorName,
        name: menuItem.name,
        dishType: menuItem.dishType,
        description: menuItem.description,
        price: menuItem.price,
        image: menuItem.image,
      });
    } else {
      res.status(400).json({ error: "A vendor with that ID does not exist" });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
    console.error("Error registering customer:", error);
  }
}

// export async function updateMenuItem(req, res) {
//   try {
//     const menuItem = await Menu.findById(req.params.id);
//     if (!menuItem) {
//       res.status(400);
//       throw new Error("The menuItem you tried to update does not exist");
//     }
//     const { name, description, category, price } = req.body;
//     if (req.file) {
//       let image = menuItem.image;
//       // If a new image is uploaded, update it in Cloudinary
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         width: 500,
//         height: 500,
//         crop: "scale",
//         quality: 60,
//       });
//       image = result.secure_url;
//     }
//     const updatedMenuItem = await Menu.findByIdAndUpdate(
//       req.params.id,
//       {
//         name,
//         category,
//         description,
//         price,
//         image,
//       },
//       { new: true }
//     );
//     res.status(201).json(updatedMenuItem);
//   } catch (error) {
//     res
//       .status(400)
//       .json({ message: "The menu you tried to update does not exist" });
//   }
// }
 export async function updateMenuItem(req, res) {
    const menuItem = await Menu.findById(req.params.id);
  
    if (!menuItem) {
      res.status(400);
      throw new Error("The menuItem you tried to update does not exist");
    } else {
      const { name, description, dishType, price } = req.body;
      let image = menuItem.image;
  
      if (req.file) {
        // If a new image is uploaded, update it in Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          width: 500,
          height: 500,
          crop: "scale",
          quality: 60
        });
        image = result.secure_url
      }
  
      const updatedmenuItem = await Menu.findByIdAndUpdate(
        req.params.id,
        { name, description, dishType, price, image },
        { new: true }
      );
  
      res.status(200).json(updatedmenuItem);
    }
  }

export async function getMenuItems(req, res) {
  try {
    const items = await Menu.find();
    if (!items) {
      res.status(400);
      throw new Error("There are no menu items at this time");
    } else {
      res.status(200).json(items);
    }
  } catch (error) {
    res.status(400).json({ message: "There are no menu items at this time" });
  }
}

export async function getMenuItemByVendor(req, res) {
  try {
    const item = await Menu.find({ vendorID: req.params.vendorId });
    if (!item) {
      res.status(400);
      throw new Error("There are no dishes by this vendor.");
    } else {
      res.status(200).json(item);
    }
  } catch (error) {
    res.status(400).json({ message: "There are no dishes by this vendor." });
  }
}

export async function getMenuItem(req, res) {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) {
      res.status(400);
      throw new Error("This menu item does not exist");
    } else {
      res.status(200).json(item);
    }
  } catch (error) {
    res.status(400).json({ message: "This menu item does not exist" });
  }
}

export async function deleteMenuItem(req, res) {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error("Item not found ");
    } else {
      await Menu.findByIdAndDelete(req.params.id);
      res.status(200).json({ id: req.params.id, message: "Item deleted" });
    }
  } catch (error) {
    res.status(400).json({ message: "Menu item not found" });
  }
}

export default {
  addMenuItem,
  updateMenuItem,
  getMenuItemByVendor,
  getMenuItem,
  getMenuItems,
  deleteMenuItem,
};
