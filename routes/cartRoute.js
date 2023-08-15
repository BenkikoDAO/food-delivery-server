import { addCartItem, getCartItems, updateCart, deleteItem } from '../controllers/cartController.js'
import customerProtect from '../middleware/customerMiddleware.js'
import express from 'express'
const router = express.Router()

router.route('/add').post(customerProtect,addCartItem)
router.route('/items/:id').get(getCartItems)
router.route('/update/:id').put(customerProtect,updateCart)
router.route('/delete/:id').delete(deleteItem)

export default router