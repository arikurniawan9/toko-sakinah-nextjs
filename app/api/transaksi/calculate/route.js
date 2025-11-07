// app/api/transaksi/calculate/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate transaction totals based on quantity and member discounts
 * 
 * Request body should contain:
 * - items: Array of objects with { productId, quantity }
 * - memberId: Optional - ID of member for discount calculation
 */
export async function POST(request) {
  try {
    const { items, memberId } = await request.json();
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and cannot be empty' }, 
        { status: 400 }
      );
    }

    let subtotal = 0;
    let totalDiscount = 0; // This includes both item discounts and member discounts
    let itemDiscount = 0;  // Only the item-level discounts
    let memberDiscount = 0; // Only the member-level discount
    let tax = 0; // Optional tax
    let calculatedItems = [];

    // Fetch product details for each item
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product with id ${item.productId} not found` }, 
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` }, 
          { status: 400 }
        );
      }

      // Calculate discount per item based on quantity
      let discountPerItem = 0;
      
      if (item.quantity >= 1 && item.quantity <= 3) {
        // Default discount of 1000 or admin-specified discount for qty 1-3
        discountPerItem = product.discount1_3;
      } else if (item.quantity >= 4 && item.quantity <= 6) {
        // Discount for qty 4-6 as specified by admin
        discountPerItem = product.discount4_6;
      } else if (item.quantity > 6) {
        // Discount for qty >6 if specified by admin, otherwise 0
        discountPerItem = product.discountMore || 0;
      }

      // Calculate the price after item discount
      const priceAfterItemDiscount = product.sellingPrice - discountPerItem;
      const itemSubtotal = priceAfterItemDiscount * item.quantity;
      const itemDiscountAmount = discountPerItem * item.quantity;

      calculatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        originalPrice: product.sellingPrice,
        discountPerItem: discountPerItem,
        itemDiscount: itemDiscountAmount,
        priceAfterItemDiscount: priceAfterItemDiscount,
        subtotal: itemSubtotal
      });

      subtotal += itemSubtotal;
      itemDiscount += itemDiscountAmount;
    }

    // Apply member discount if member ID is provided
    if (memberId) {
      const member = await prisma.member.findUnique({
        where: { id: memberId }
      });

      if (!member) {
        return NextResponse.json(
          { error: `Member with id ${memberId} not found` }, 
          { status: 404 }
        );
      }

      // Apply member discount percentage to the subtotal (after item discounts)
      memberDiscount = (subtotal * member.discount) / 100;
    }

    // Calculate final total after member discount
    const totalAfterMemberDiscount = subtotal - memberDiscount;
    
    // Optional tax calculation (5% as example)
    // In a real application, tax rate might come from settings
    tax = totalAfterMemberDiscount * 0.05; // 5% tax
    const grandTotal = totalAfterMemberDiscount + tax;

    // Calculate total discount (both item and member discounts)
    totalDiscount = itemDiscount + memberDiscount;

    return NextResponse.json({
      items: calculatedItems,
      subTotal: subtotal,  // Total before any discounts
      itemDiscount: itemDiscount,  // Total discount from item quantities
      memberDiscount: memberDiscount,  // Total discount from membership
      totalDiscount: totalDiscount,  // Combined discount
      tax: tax,  // Tax amount
      totalAfterDiscounts: totalAfterMemberDiscount,  // Total after member discount but before tax
      grandTotal: Math.round(grandTotal),  // Final total including tax
    });
  } catch (error) {
    console.error('Error calculating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to calculate transaction' }, 
      { status: 500 }
    );
  }
}