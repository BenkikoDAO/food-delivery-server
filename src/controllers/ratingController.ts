import { Request, Response } from "express";

import Vendor from "../models/vendor";
import Customer from "../models/customer";
import Rating from "../models/rating";

export async function postRating(req: Request, res: Response) {
  try {
    const { rating, vendorName, customerId } = req.body;

    if (!rating || !vendorName || !customerId) {
      return res.status(400).json("All fields are required");
    }

    const vendor = await Vendor.findOne({ name: vendorName });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const newRating = new Rating({
      rating,
      vendorName,
      customerId,
    });

    await newRating.save();

    // Calculate the new average rating for the vendor
    const ratings = await Rating.find({ vendorName });

    const totalRating = ratings.reduce(
      (total, rating) => total + (rating.rating ?? 0), //if undefined, rating.rating defaults to 0
      0
    );
    const averageRating = totalRating / ratings.length;

    // Update the vendor's rating field in the Vendor model
    vendor.rating = parseFloat(averageRating.toFixed(1));
    await vendor.save();

    res.status(201).json({ message: "Rating posted successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json(`Something went wrong - ${error}`);
  }
}
