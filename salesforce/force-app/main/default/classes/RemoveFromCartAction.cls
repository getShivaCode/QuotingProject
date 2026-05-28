public with sharing class RemoveFromCartAction {

    public class Request {
        @InvocableVariable(
            label='SKU'
            description='The SKU of the product to remove'
            required=true
        )
        public String sku;

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
            description='The updated shopping cart after removal'
        )
        public String updatedCart;
    }

    @InvocableMethod(
        label='Remove from Cart'
        description='Remove an item from the shopping cart by SKU'
    )
    public static List<Result> removeFromCart(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                List<Object> currentCart = new List<Object>();

                if (req.currentCart != null && req.currentCart != '') {
                    Object parsed = JSON.deserializeUntyped(req.currentCart);
                    if (parsed instanceof List<Object>) {
                        currentCart = (List<Object>) parsed;
                    } else if (parsed instanceof Map<String, Object>) {
                        Map<String, Object> cartMap = (Map<String, Object>) parsed;
                        if (cartMap.containsKey('items')) {
                            currentCart = (List<Object>) cartMap.get('items');
                        }
                    }
                }

                List<Object> updatedCart = new List<Object>();
                Decimal newTotal = 0;

                for (Object item : currentCart) {
                    Map<String, Object> itemMap = (Map<String, Object>) item;
                    String itemSku = (String) itemMap.get('sku');

                    if (itemSku != null && itemSku.equals(req.sku)) {
                        continue;
                    }

                    updatedCart.add(itemMap);
                    Object lt = itemMap.get('lineTotal');
                    if (lt != null) {
                        newTotal += (Decimal) lt;
                    }
                }

                Map<String, Object> cartResponse = new Map<String, Object>{
                    'items' => updatedCart,
                    'itemCount' => updatedCart.size(),
                    'grandTotal' => newTotal,
                    'message' => 'Item with SKU ' + req.sku + ' removed from cart'
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
