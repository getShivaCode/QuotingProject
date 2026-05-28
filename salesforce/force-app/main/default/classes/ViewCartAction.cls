public with sharing class ViewCartAction {

    public class Request {
        @InvocableVariable(
            label='Current Cart'
            description='JSON array of current cart items'
        )
        public String currentCart;
    }

    public class Result {
        @InvocableVariable(
            label='Cart Summary'
            description='Current cart contents with quantities, prices, and grand total'
        )
        public String cartSummary;
    }

    @InvocableMethod(
        label='View Cart'
        description='View the current shopping cart'
    )
    public static List<Result> viewCart(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                List<Object> items = new List<Object>();

                if (req.currentCart != null && req.currentCart != '') {
                    Object parsed = JSON.deserializeUntyped(req.currentCart);
                    if (parsed instanceof List<Object>) {
                        items = (List<Object>) parsed;
                    } else if (parsed instanceof Map<String, Object>) {
                        Map<String, Object> cartMap = (Map<String, Object>) parsed;
                        if (cartMap.containsKey('items')) {
                            items = (List<Object>) cartMap.get('items');
                        }
                    }
                }

                if (items.isEmpty()) {
                    Map<String, Object> emptyResponse = new Map<String, Object>{
                        'message' => 'Your shopping cart is empty',
                        'itemCount' => 0,
                        'grandTotal' => 0,
                        'items' => new List<Object>()
                    };
                    r.cartSummary = JSON.serialize(emptyResponse);
                } else {
                    Decimal grandTotal = 0;
                    for (Object item : items) {
                        Map<String, Object> itemMap = (Map<String, Object>) item;
                        Object lt = itemMap.get('lineTotal');
                        if (lt != null) {
                            grandTotal += (Decimal) lt;
                        }
                    }

                    Map<String, Object> cartResponse = new Map<String, Object>{
                        'items' => items,
                        'itemCount' => items.size(),
                        'grandTotal' => grandTotal,
                        'message' => 'Your shopping cart contains ' + items.size() + ' item(s)'
                    };
                    r.cartSummary = JSON.serialize(cartResponse);
                }
            } catch (Exception e) {
                r.cartSummary = '{"error": "' + e.getMessage().replace('"', '\\"') + '"}';
            }
            results.add(r);
        }
        return results;
    }
}
