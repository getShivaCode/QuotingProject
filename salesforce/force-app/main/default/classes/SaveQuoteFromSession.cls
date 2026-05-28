public with sharing class SaveQuoteFromSession {

    public class Request {
        @InvocableVariable(
            label='Quote Name'
            description='Name for the quote record'
            required=true
        )
        public String quoteName;

        @InvocableVariable(
            label='Quote Data'
            description='The full quote JSON from generate_quote containing breakdown, grand_total, and accountId'
            required=true
        )
        public String quoteData;
    }

    public class Result {
        @InvocableVariable(
            label='Quote ID'
            description='The ID of the created Quote record'
        )
        public String quoteId;

        @InvocableVariable(
            label='Quote Number'
            description='The quote number assigned by Salesforce'
        )
        public String quoteNumber;
    }

    @InvocableMethod(
        label='Save Quote From Session'
        description='Creates an Opportunity, Quote, and QuoteLineItem from the generate_quote JSON data'
    )
    public static List<Result> saveQuote(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            try {
                Decimal grandTotal = 0;
                String description = '';

                Map<String, Object> quoteJson = (Map<String, Object>) JSON.deserializeUntyped(req.quoteData);
                String accountId = (String) quoteJson.get('accountId');
                if (quoteJson.containsKey('grand_total')) {
                    grandTotal = (Decimal) quoteJson.get('grand_total');
                }
                if (quoteJson.containsKey('breakdown')) {
                    List<Object> breakdown = (List<Object>) quoteJson.get('breakdown');
                    List<String> lines = new List<String>();
                    for (Object item : breakdown) {
                        Map<String, Object> prod = (Map<String, Object>) item;
                        String name = (String) prod.get('name');
                        String sku = (String) prod.get('sku');
                        Object qtyObj = prod.get('quantity');
                        String qty = qtyObj != null ? String.valueOf(qtyObj) : '1';
                        Decimal subtotal = prod.containsKey('subtotal') ? (Decimal) prod.get('subtotal') : 0;
                        lines.add(name + ' (' + sku + ') x' + qty + ' = $' + subtotal);
                    }
                    description = String.join(lines, '\n') + '\n\nGrand Total: $' + grandTotal;
                } else {
                    description = req.quoteData;
                }

                Opportunity opp = new Opportunity();
                opp.Name = req.quoteName;
                opp.AccountId = accountId;
                opp.StageName = 'Prospecting';
                opp.CloseDate = Date.today().addDays(30);
                opp.Amount = grandTotal;
                opp.Pricebook2Id = '01sfj000007sHPdAAM';
                insert opp;

                Quote q = new Quote();
                q.Name = req.quoteName;
                q.OpportunityId = opp.Id;
                q.Description = description;
                q.Pricebook2Id = '01sfj000007sHPdAAM';
                insert q;

                QuoteLineItem qli = new QuoteLineItem();
                qli.QuoteId = q.Id;
                qli.PricebookEntryId = '01ufj0000038BbnAAE';
                qli.Quantity = 1;
                qli.UnitPrice = grandTotal;
                qli.Description = description;
                insert qli;

                Quote savedQuote = [SELECT Id, QuoteNumber FROM Quote WHERE Id = :q.Id LIMIT 1];
                r.quoteId = savedQuote.Id;
                r.quoteNumber = savedQuote.QuoteNumber;
            } catch (Exception e) {
                r.quoteId = 'Error: ' + e.getMessage();
                r.quoteNumber = '';
            }
            results.add(r);
        }
        return results;
    }
}
