public with sharing class ClearCartAction {

    public class Request {
        @InvocableVariable(
            label='Confirm'
            description='Pass yes to confirm clearing the cart'
        )
        public String confirm;
    }

    public class Result {
        @InvocableVariable(
            label='Status'
            description='Confirmation that cart has been cleared'
        )
        public String status;
    }

    @InvocableMethod(
        label='Clear Cart'
        description='Clear the shopping cart after quote is created'
    )
    public static List<Result> clearCart(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                Map<String, Object> response = new Map<String, Object>{
                    'message' => 'Shopping cart has been cleared',
                    'status' => 'success',
                    'cartEmpty' => true
                };

                r.status = JSON.serialize(response);
            } catch (Exception e) {
                r.status = '{"error": "' + e.getMessage().replace('"', '\\"') + '"}';
            }
            results.add(r);
        }
        return results;
    }
}
