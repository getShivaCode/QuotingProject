public with sharing class UpdateCartQuantityAction {

    public class Request {
        @InvocableVariable(
            label='SKU'
            description='The SKU of the product to update'
            required=true
        )
        public String sku;

        @InvocableVariable(
            label='New Quantity'
            description='The new quantity for this product'
            required=true
        )
        public Integer newQuantity;

        @InvocableVariable(
            label='Current Cart'
            description='JSON array of current cart items'
            required=true
        )
        public String currentCart;
    }

    public class Result {
        @InvocableVariable(
            label='Updated Cart'
            description='The updated shopping cart with recalculated totals'
        )
        public String updatedCart;
    }

    @InvocableMethod(
        label='Update Cart Quantity'
        description='Update the quantity of an item in the shopping cart'
    )
    public static List<Result> updateCartQuantity(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                if (req.newQuantity < 0) {
                    r.updatedCart = '{"error": "Quantity must be greater than or equal to 0"}';
                    results.add(r);
                    continue;
                }

                List<Object> cartItems = new List<Object>();

                if (req.currentCart != null && req.currentCart != '') {
                    Object parsed = JSON.deserializeUntyped(req.currentCart);
                    if (parsed instanceof List<Object>) {
                        cartItems = (List<Object>) parsed;
                    } else if (parsed instanceof Map<String, Object>) {
                        Map<String, Object> cartMap = (Map<String, Object>) parsed;
                        if (cartMap.containsKey('items')) {
                            cartItems = (List<Object>) cartMap.get('items');
                        }
                    }
                }

                List<Object> updatedCart = new List<Object>();
                Decimal newTotal = 0;
                Boolean found = false;

                for (Object item : cartItems) {
                    Map<String, Object> itemMap = (Map<String, Object>) item;
                    String itemSku = (String) itemMap.get('sku');

                    if (itemSku != null && itemSku.equals(req.sku)) {
                        found = true;
                        if (req.newQuantity == 0) {
                            continue;
                        }

                        Decimal unitPrice = (Decimal) itemMap.get('unitPrice');
                        itemMap.put('quantity', req.newQuantity);
                        itemMap.put('lineTotal', unitPrice * req.newQuantity);
                        updatedCart.add(itemMap);
                        newTotal += (unitPrice * req.newQuantity);
                    } else {
                        updatedCart.add(itemMap);
                        Object lt = itemMap.get('lineTotal');
                        if (lt != null) {
                            newTotal += (Decimal) lt;
                        }
                    }
                }

                Map<String, Object> cartResponse = new Map<String, Object>{
                    'items' => updatedCart,
                    'itemCount' => updatedCart.size(),
                    'grandTotal' => newTotal,
                    'message' => found ? 'Quantity updated for SKU ' + req.sku : 'SKU ' + req.sku + ' not found in cart'
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
