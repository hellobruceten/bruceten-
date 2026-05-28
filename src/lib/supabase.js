import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug, icon)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) { console.error(error); return [] }
  return data
}

export async function placeOrder(cart, formData) {
  const { data: customer } = await supabase
    .from('customers')
    .upsert({
      email: formData.email,
      full_name: formData.name,
      phone: formData.phone,
      address: formData.address,
    }, { onConflict: 'email' })
    .select().single()

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const { data: order } = await supabase
    .from('orders')
    .insert({
      customer_id: customer.id,
      total,
      payment_method: formData.payment,
      payment_status: 'unpaid',
      delivery_address: formData.address,
      status: 'pending',
    })
    .select().single()

  await supabase.from('order_items').insert(
    cart.map(i => ({
      order_id: order.id,
      product_id: i.id,
      quantity: i.qty,
      unit_price: i.price,
    }))
  )
  return { success: true, orderId: order.id }
}
