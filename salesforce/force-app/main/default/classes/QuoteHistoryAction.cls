public with sharing class QuoteHistoryAction {

    public class Request {
        @InvocableVariable(
            label='Account ID'
            description='The Salesforce Account ID to retrieve quotes for'
            required=true
        )
        public String accountId;
    }

    public class Result {
        @InvocableVariable(
            label='Quotes'
            description='JSON string of quotes with their status, amounts, and dates'
        )
        public String quotes;
    }

    @InvocableMethod(
        label='Get Quote History'
        description='Retrieves quote history for an account from Salesforce'
    )
    public static List<Result> getQuoteHistory(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            List<Quote> quotes = [
                SELECT Id, QuoteNumber, Name, Status, GrandTotal, CreatedDate, Description
                FROM Quote
                WHERE Opportunity.AccountId = :req.accountId
                WITH USER_MODE
                ORDER BY CreatedDate DESC
                LIMIT 20
            ];
            List<Map<String, String>> quoteList = new List<Map<String, String>>();
            for (Quote q : quotes) {
                Map<String, String> qMap = new Map<String, String>();
                qMap.put('Id', q.Id);
                qMap.put('QuoteNumber', q.QuoteNumber);
                qMap.put('Name', q.Name);
                qMap.put('Status', q.Status != null ? q.Status : 'Draft');
                qMap.put('GrandTotal', q.GrandTotal != null ? String.valueOf(q.GrandTotal) : '0');
                qMap.put('CreatedDate', String.valueOf(q.CreatedDate));
                qMap.put('Description', q.Description != null ? q.Description : '');
                quoteList.add(qMap);
            }
            r.quotes = JSON.serialize(quoteList);
            results.add(r);
        }
        return results;
    }
}
