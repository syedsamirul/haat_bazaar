import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

async function seedDatabase() {
  try {
    // Demo vendors with proper UUIDs
    const vendorIds = [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003',
    ]

    const demoVendors = [
      {
        id: vendorIds[0],
        instagram_handle: 'saree_dreams',
        shop_name: 'Saree Dreams',
        description: 'Authentic handwoven Bengali sarees and traditional wear',
        profile_image_url:
          'https://picsum.photos/400/400?random=1',
        follower_count: 2500,
        category: 'clothing',
        verified: true,
      },
      {
        id: vendorIds[1],
        instagram_handle: 'blossom_crafts',
        shop_name: 'Blossom Crafts',
        description: 'Handmade jewelry and accessories from local artisans',
        profile_image_url:
          'https://picsum.photos/400/400?random=2',
        follower_count: 1800,
        category: 'accessories',
        verified: true,
      },
      {
        id: vendorIds[2],
        instagram_handle: 'spice_kitchen_bd',
        shop_name: 'Spice Kitchen',
        description: 'Organic spice blends and traditional Bangladeshi condiments',
        profile_image_url:
          'https://picsum.photos/400/400?random=3',
        follower_count: 3200,
        category: 'food',
        verified: false,
      },
      {
        id: vendorIds[3],
        instagram_handle: 'clay_creations',
        shop_name: 'Clay Creations',
        description: 'Beautiful handmade pottery and ceramic home decor',
        profile_image_url:
          'https://picsum.photos/400/400?random=4',
        follower_count: 1500,
        category: 'crafts',
        verified: true,
      },
    ]

    // Insert vendors
    const { error: vendorError } = await supabase.from('vendors').upsert(demoVendors, {
      onConflict: 'id',
    })

    if (vendorError) throw vendorError

    // Demo products
    const demoProducts = [
      {
        vendor_id: vendorIds[0],
        name: 'Red Silk Saree',
        description: 'Traditional red silk saree with gold embroidery',
        price: 4500,
        image_url:
          'https://picsum.photos/500/500?random=10',
        category: 'clothing',
        in_stock: true,
      },
      {
        vendor_id: vendorIds[0],
        name: 'White Cotton Saree',
        description: 'Comfortable white cotton saree, perfect for daily wear',
        price: 2800,
        image_url:
          'https://picsum.photos/500/500?random=11',
        category: 'clothing',
        in_stock: true,
      },
      {
        vendor_id: vendorIds[1],
        name: 'Beaded Choker Necklace',
        description: 'Handmade beaded necklace with traditional patterns',
        price: 1200,
        image_url:
          'https://picsum.photos/500/500?random=12',
        category: 'accessories',
        in_stock: true,
      },
      {
        vendor_id: vendorIds[1],
        name: 'Brass Bangles Set',
        description: 'Set of 6 traditional brass bangles',
        price: 800,
        image_url:
          'https://picsum.photos/500/500?random=13',
        category: 'accessories',
        in_stock: true,
      },
      {
        vendor_id: vendorIds[2],
        name: 'Garam Masala Blend',
        description: 'Premium garam masala with 8 spices',
        price: 350,
        image_url:
          'https://picsum.photos/500/500?random=14',
        category: 'food',
        in_stock: true,
      },
      {
        vendor_id: vendorIds[2],
        name: 'Turmeric Powder',
        description: 'Pure organic turmeric powder',
        price: 250,
        image_url:
          'https://picsum.photos/500/500?random=15',
        category: 'food',
        in_stock: true,
      },
      {
        vendor_id: vendorIds[3],
        name: 'Blue Ceramic Vase',
        description: 'Handmade ceramic vase with blue glaze',
        price: 1800,
        image_url:
          'https://picsum.photos/500/500?random=16',
        category: 'crafts',
        in_stock: true,
      },
      {
        vendor_id: vendorIds[3],
        name: 'Terracotta Pots',
        description: 'Set of 3 terracotta pots for plants',
        price: 950,
        image_url:
          'https://picsum.photos/500/500?random=17',
        category: 'crafts',
        in_stock: true,
      },
    ]

    // Insert products
    const { error: productError } = await supabase.from('products').insert(demoProducts)

    if (productError) throw productError

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      vendors: demoVendors.length,
      products: demoProducts.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return seedDatabase()
}

export async function POST() {
  return seedDatabase()
}
