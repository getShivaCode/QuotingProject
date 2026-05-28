public with sharing class AddToCartAction {

    public class Request {
        @InvocableVariable(
            label='Cart Items'
            description='JSON array of priced items to add [{sku, productName, description, quantity, unitPrice, lineTotal}]'
            required=true
        )
        public String cartItems;

        @InvocableVariable(
            label='Current Cart'
            description='JSON array of current cart items (pass existing cart contents)'
        )
        public String currentCart;
    }

    public class Result {
        @InvocableVariable(
            label='Updated Cart'
            description='The updated shopping cart with all items and new grand total'
        )
        public String updatedCart;
    }

    @InvocableMethod(
        label='Add to Cart'
        description='Add priced items to the shopping cart and update cart total'
    )
    public static List<Result> addToCart(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                List<Object> itemsToAdd = (List<Object>) JSON.deserializeUntyped(req.cartItems);
                List<Object> existingCart = new List<Object>();

                if (req.currentCart != null && req.currentCart != '') {
                    Object parsed = JSON.deserializeUntyped(req.currentCart);
                    if (parsed instanceof List<Object>) {
                        existingCart = (List<Object>) parsed;
                    } else if (parsed instanceof Map<String, Object>) {
                        Map<String, Object> cartMap = (Map<String, Object>) parsed;
                        if (cartMap.containsKey('items')) {
                            existingCart = (List<Object>) cartMap.get('items');
                        }
                    }
                }

                Map<String, Map<String, Object>> cartBySku = new Map<String, Map<String, Object>>();
                for (Object item : existingCart) {
                    Map<String, Object> itemMap = (Map<String, Object>) item;
                    String sku = (String) itemMap.get('sku');
                    if (sku != null) {
                        cartBySku.put(sku, itemMap);
                    }
                }

                for (Object item : itemsToAdd) {
                    Map<String, Object> newItem = (Map<String, Object>) item;
                    String sku = (String) newItem.get('sku');
                    if (sku != null && cartBySku.containsKey(sku)) {
                        Map<String, Object> existing = cartBySku.get(sku);
                        Integer newQty = (Integer) newItem.get('quantity');
                        Decimal unitPrice = (Decimal) newItem.get('unitPrice');
                        existing.put('quantity', newQty);
                        existing.put('unitPrice', unitPrice);
                        existing.put('lineTotal', unitPrice * newQty);
                        if (newItem.containsKey('description')) {
                            existing.put('description', newItem.get('description'));
                        }
                    } else {
                        cartBySku.put(sku, newItem);
                    }
                }

                List<Object> mergedCart = new List<Object>();
                mergedCart.addAll(cartBySku.values());

                Decimal grandTotal = 0;
                for (Object item : mergedCart) {
                    Map<String, Object> itemMap = (Map<String, Object>) item;
                    Object lt = itemMap.get('lineTotal');
                    if (lt != null) {
                        grandTotal += (Decimal) lt;
                    }
                }

                Map<String, Object> cartResponse = new Map<String, Object>{
                    'items' => mergedCart,
                    'itemCount' => mergedCart.size(),
                    'grandTotal' => grandTotal
                };

                r.updatedCart = JSON.serialize(cartResponse);
            } catch (Exception e) {
                r.updatedCart = '{"error": "' + e.getMessage().replace('"', '\\"') + '"}';
            }
            results.add(r);
        }
        return results;
    }
}
