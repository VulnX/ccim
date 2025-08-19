use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    ccim_server::run().await
}
