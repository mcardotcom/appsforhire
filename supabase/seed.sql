-- Insert test usage summary
INSERT INTO usage_summaries (
    user_id,
    total_calls,
    total_tokens,
    success_rate,
    avg_response_time,
    calls_change,
    tokens_change,
    success_rate_change,
    response_time_change
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
    100,
    5000,
    95.5,
    250,
    10,
    500,
    2.5,
    -50
);

-- Insert test tool logs
INSERT INTO tool_logs (
    user_id,
    tool_name,
    tool_version,
    status,
    execution_time_ms,
    tokens_used
) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'code-search', '1.0.0', 'success', 150, 100),
    ('00000000-0000-0000-0000-000000000000', 'code-search', '1.0.0', 'success', 200, 150),
    ('00000000-0000-0000-0000-000000000000', 'code-search', '1.0.0', 'error', 100, 50),
    ('00000000-0000-0000-0000-000000000000', 'code-search', '1.0.0', 'success', 180, 120);

-- Insert test API key
INSERT INTO api_keys (
    user_id,
    key_name,
    key_value,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Test API Key',
    'test_api_key_123',
    true
); 