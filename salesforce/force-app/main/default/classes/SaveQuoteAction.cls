public with sharing class SaveQuoteAction {

    public class Request {
        @InvocableVariable(
            label='Account ID'
            description='The Salesforce Account ID to associate the quote with'
            required=true
        )
        public String accountId;

        @InvocableVariable(
            label='Grand Total'
            description='The grand total price of the quote'
            required=true
        )
        public String grandTotal;

        @InvocableVariable(
            label='Quote Description'
            description='Description including product names and quantities'
            required=true
        )
        public String quoteDescription;

        @InvocableVariable(
            label='Quote Name'
            description='Name for the quote record'
            required=true
        )
        public String quoteName;
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
        label='Save Quote'
        description='Creates a Quote record in Salesforce linked to the specified account'
    )
    public static List<Result> saveQuote(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();

            Opportunity opp = new Opportunity();
            opp.Name = req.quoteName + ' - Opportunity';
            opp.AccountId = req.accountId;
            opp.StageName = 'Prospecting';
            opp.CloseDate = Date.today().addDays(30);
            opp.Amount = Decimal.valueOf(req.grandTotal);
            insert opp;

            Quote q = new Quote();
            q.Name = req.quoteName;
            q.OpportunityId = opp.Id;
            q.Description = 'Grand Total: ' + req.grandTotal + '\n\n' + req.quoteDescription;
            insert q;

            Quote savedQuote = [SELECT Id, QuoteNumber FROM Quote WHERE Id = :q.Id LIMIT 1];
            r.quoteId = savedQuote.Id;
            r.quoteNumber = savedQuote.QuoteNumber;
            results.add(r);
        }
        return results;
    }
}
