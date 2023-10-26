import { Request, Response } from "express";
import Menu from "../models/menu";
import Vendor from "../models/vendor";
import cloudinary from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import logger from "../helpers/logging";
import redisClient from "../helpers/redisClient";
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

const options = {
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

cloudinary.v2.config(options);
export async function addMenuItem(req: Request, res: Response) {
  try {
    const { vendorID, name, dishType, description, price } = req.body;
    if (!vendorID || !name || !dishType || !description || !price) {
      return res
        .status(400)
        .json({ message: "Please enter all the required fields" });
    }
    const image = req.file;
    if (!image) {
      return res.status(400).json({ message: "Menu Item image is required" });
    }
    const result = await cloudinary.v2.uploader.upload(image.path, {
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
        vendorContact: vendorExists.phoneNumber,
        image: result.secure_url,
      });
      logger.info("Menu item added successfully by: ", vendorExists.name);
      res.status(201).json({
        _id: menuItem.id,
        vendorContact: menuItem.vendorContact,
        vendorID: menuItem.vendorID,
        vendorName: menuItem.vendorName,
        name: menuItem.name,
        dishType: menuItem.dishType,
        description: menuItem.description,
        price: menuItem.price,
        image: menuItem.image,
      });
      //after a menu item is saved, update cache with new menu except those that of dishtype extras
      const items = await Menu.find();

      // Filter out items with dishType of "Extras"
      const filteredItems = items.filter((item) => item.dishType !== "Extras");
      const redisKey = "menus";
      await redisClient.set(redisKey, JSON.stringify(filteredItems));

      //if the item added was under extras dishType, update that cache as well
      if (menuItem.dishType === "Extras") {
        const redisKey = `extras:${vendorID}`;
        const items = await Menu.find({
          vendorID,
          dishType: "Extras",
        });

        await redisClient.set(redisKey, JSON.stringify(items));
      }
    } else {
      res.status(400).json({ error: "A vendor with that ID does not exist" });
    }
  } catch (error) {
    logger.error("An error occured when adding menu item: ", error);
    res.status(500).json({ error: "An error occurred" });
    console.error("Error registering customer:", error);
  }
}

export async function updateMenuItem(req: Request, res: Response) {
  try {
    const menuItem = await Menu.findById(req.params.id);

    if (!menuItem) {
      return res
        .status(400)
        .json({ error: "The menuItem you tried to update does not exist" });
    } else {
      const { name, description, dishType, price } = req.body;
      let image = menuItem.image;

      if (req.file) {
        // If a new image is uploaded, update it in Cloudinary
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          width: 500,
          height: 500,
          crop: "scale",
          quality: 60,
        });
        image = result.secure_url;
      }

      const updatedmenuItem = await Menu.findByIdAndUpdate(
        req.params.id,
        { name, description, dishType, price, image },
        { new: true }
      );
      logger.info("Menu item updated successfully");
      res.status(200).json(updatedmenuItem);
      //check if an extra was updated then update the cache
      if (updatedmenuItem?.dishType === "Extras") {
        const redisKey = `extras:${menuItem.vendorID}`;
        const items = await Menu.find({
          vendorID: menuItem.vendorID,
          dishType: "Extras",
        });

        await redisClient.set(redisKey, JSON.stringify(items));
      }
    }
    //update "menus" cache as a whole
    const items = await Menu.find();
    // Filter out items with dishType of "Extras"
    const filteredItems = items.filter((item) => item.dishType !== "Extras");
    const redisKey = "menus";
    await redisClient.set(redisKey, JSON.stringify(filteredItems));
  } catch (error) {
    logger.error("An error occured when adding menu item: ", error);
    return res.status(400);
  }
}

export async function getMenuItems(req: Request, res: Response) {
  try {
    const redisKey = "menus";
    const cachedMenus = await redisClient.get(redisKey);
    if (cachedMenus) {
      res.status(200).json(JSON.parse(cachedMenus));
    } else {
      const items = await Menu.find();
      // Filter out items with dishType of "Extras"
      const filteredItems = items.filter((item) => item.dishType !== "Extras");
      await redisClient.set(redisKey, JSON.stringify(filteredItems));
      res.status(200).json(filteredItems);
    }
  } catch (error) {
    logger.error("There are no vendor items at this time");
    res.status(400).json({ message: "There are no menu items at this time" });
  }
}

export async function getExtras(req: Request, res: Response) {
  try {
    const vendorId = req.params.id;
    const redisKey = `extras:${vendorId}`;
    const cachedExtras = await redisClient.get(redisKey);
    if (cachedExtras) {
      res.status(200).json(JSON.parse(cachedExtras));
    } else {
      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      const items = await Menu.find({
        vendorID: vendor._id,
        dishType: "Extras",
      });
      res.status(200).json(items);
      await redisClient.set(redisKey, JSON.stringify(items));
    }
  } catch (error) {
    logger.error("There are no vendor items at this time");
    res.status(400).json({ message: "There are no menu items at this time" });
  }
}

export async function getMenuItemByVendor(req: Request, res: Response) {
  try {
    const redisKey = "menus";
    const cachedMenu = await redisClient.get(redisKey);
    let parsedMenu;

    if (cachedMenu !== null) {
      parsedMenu = JSON.parse(cachedMenu);
    }

    const menuItems = parsedMenu.filter(
      (item: any) => item.vendorID === req.params.vendorId
    );

    if (menuItems) {
      res.status(200).json(menuItems);
    } else {
      const items = await Menu.find({ vendorID: req.params.vendorId });
      if (items.length > 0) {
        res.status(200).json(items);
      } else {
        res.status(404).json({ message: "No dishes found for this vendor" });
      }
    }
  } catch (error) {
    logger.error("An error occurred while fetching menu items.", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching menu items" });
  }
}

export async function getMenuItem(req: Request, res: Response) {
  try {
    const redisKey = "menus";
    const cachedMenus = await redisClient.get(redisKey);

    let parsedMenu;
    if (cachedMenus !== null) {
      parsedMenu = JSON.parse(cachedMenus);
    }
    //find the item in cache
    const menuItem = parsedMenu.find((item: any) => item._id === req.params.id);
    //check if it exists in cache and send it in response
    if (menuItem) {
      res.status(200).json(menuItem);
    } else {
      const item = await Menu.findById(req.params.id);
      if (!item) {
        return res.status(400).json({ error: "This menu item does not exist" });
      } else {
        res.status(200).json(item);
        const items = await Menu.find();
        // Filter out items with dishType of "Extras"
        const filteredItems = items.filter(
          (item) => item.dishType !== "Extras"
        );
        await redisClient.set(redisKey, JSON.stringify(filteredItems));
      }
    }
  } catch (error) {
    logger.error("Menu item does not exist");
    res.status(400).json({ message: "This menu item does not exist" });
  }
}

export async function deleteMenuItem(req: Request, res: Response) {
  try {
    const item = await Menu.findById(req.params.id);
    const redisKey = "menus";
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const vendor = await Vendor.findById(item.vendorID);
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
    }

    if (vendor) {
      // Remove the item name from the specialties array
      vendor.specialties = vendor.specialties.filter(
        (dish) => dish !== item.name
      );

      // Save the updated vendor object
      await vendor.save();
    } else {
      // Handle the case where vendor is null, e.g., by returning an error response
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Delete the menu item
    await Menu.findByIdAndDelete(req.params.id);

    //update menu in cache
    const items = await Menu.find();
    const filteredItems = items.filter((item) => item.dishType !== "Extras");
    await redisClient.set(redisKey, JSON.stringify(filteredItems));

    logger.info(
      `Menu item - ${item.name} deleted successfully by ${vendor.name}`
    );
    res.status(200).json({ id: req.params.id, message: "Item deleted" });
  } catch (error) {
    logger.error("Item not found");
    res.status(400).json({ message: "Menu item not found" });
  }
}

export default {
  addMenuItem,
  updateMenuItem,
  getMenuItemByVendor,
  getMenuItem,
  getExtras,
  getMenuItems,
  deleteMenuItem,
};
