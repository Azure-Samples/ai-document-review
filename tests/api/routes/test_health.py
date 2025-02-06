
def test_health_check(test_api_client):
    response = test_api_client.get("/api/health")
    assert response.status_code == 204
