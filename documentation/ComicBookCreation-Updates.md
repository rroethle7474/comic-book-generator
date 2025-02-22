    ## Controller updates - ComicBookController
    
    [HttpPost("{comicBookId}/assets")]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> CreateAsset(string comicBookId, [FromBody] AssetCreateRequest request)
    {
        try
        {
            if (request.ComicBookId != comicBookId)
            {
                return BadRequest(ApiResponse<AssetResponse>.Failure(
                    "Comic book ID in route must match request body",
                    "INVALID_COMIC_ID"));
            }
            var response = await _comicBookService.CreateAssetAsync(request);
            return Ok(ApiResponse<AssetResponse>.Success(response));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<AssetResponse>.Failure(
                "Comic book not found",
                "COMIC_NOT_FOUND",
                ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating asset");
            return StatusCode(500, ApiResponse<AssetResponse>.Failure(
                "An error occurred while creating the asset",
                "ASSET_CREATE_ERROR",
                ex.Message));
        }
    }

    [HttpGet("assets/{assetId}")]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> GetAsset(string assetId)
    {
        try
        {
            var response = await _comicBookService.GetAssetAsync(assetId);
            return Ok(ApiResponse<AssetResponse>.Success(response));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<AssetResponse>.Failure(
                "Asset not found",
                "ASSET_NOT_FOUND",
                ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving asset");
            return StatusCode(500, ApiResponse<AssetResponse>.Failure(
                "An error occurred while retrieving the asset",
                "ASSET_RETRIEVE_ERROR",
                ex.Message));
        }
    }

    [HttpPut("assets/{assetId}")]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> UpdateAsset(string assetId, [FromBody] AssetUpdateRequest request)
    {
        try
        {
            var response = await _comicBookService.UpdateAssetAsync(assetId, request);
            return Ok(ApiResponse<AssetResponse>.Success(response));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<AssetResponse>.Failure(
                "Asset not found",
                "ASSET_NOT_FOUND",
                ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating asset");
            return StatusCode(500, ApiResponse<AssetResponse>.Failure(
                "An error occurred while updating the asset",
                "ASSET_UPDATE_ERROR",
                ex.Message));
        }
    }

    [HttpDelete("assets/{assetId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteAsset(string assetId)
    {
        try
        {
            var response = await _comicBookService.DeleteAssetAsync(assetId);
            return Ok(ApiResponse<bool>.Success(response));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<bool>.Failure(
                "Asset not found",
                "ASSET_NOT_FOUND",
                ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting asset");
            return StatusCode(500, ApiResponse<bool>.Failure(
                "An error occurred while deleting the asset",
                "ASSET_DELETE_ERROR",
                ex.Message));
        }
    }

    [HttpGet("{comicBookId}/assets")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AssetResponse>>>> GetComicBookAssets(string comicBookId)
    {
        try
        {
            var response = await _comicBookService.GetComicBookAssetsAsync(comicBookId);
            return Ok(ApiResponse<IEnumerable<AssetResponse>>.Success(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comic book assets");
            return StatusCode(500, ApiResponse<IEnumerable<AssetResponse>>.Failure(
                "An error occurred while retrieving the comic book assets",
                "ASSETS_RETRIEVE_ERROR",
                ex.Message));
        }
    }


## Requetss

public class AssetCreateRequest
{
    public string ComicBookId { get; set; } = string.Empty;
    public string AssetType { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public int? PageNumber { get; set; }
} 

public class AssetUpdateRequest
{
    public string? AssetType { get; set; }
    public string? FilePath { get; set; }
    public int? PageNumber { get; set; }
} 

public class ComicBookCreateRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AdditionalDetails { get; set; }
} 

public class ComicBookUpdateRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? AdditionalDetails { get; set; }
    public string? FinalComicBookPath { get; set; }
    public string? GenerationStatus { get; set; }
    public bool? IsCompleted { get; set; }
} 

public class SceneCreateRequest
{
    public string ComicBookId { get; set; } = string.Empty;
    public int SceneOrder { get; set; }
    public string? ImagePath { get; set; }
    public string? StyledImagePath { get; set; }
    public string? UserDescription { get; set; }
    public string? DialogueText { get; set; }
    public string? TransitionNotes { get; set; }
} 

public class SceneUpdateRequest
{
    public string? ImagePath { get; set; }
    public string? StyledImagePath { get; set; }
    public string? UserDescription { get; set; }
    public string? DialogueText { get; set; }
    public string? TransitionNotes { get; set; }
    public int? SceneOrder { get; set; }
    public string? AiGeneratedStory { get; set; }
} 

## Respones
public class AssetResponse
{
    public string AssetId { get; set; } = string.Empty;
    public string ComicBookId { get; set; } = string.Empty;
    public string AssetType { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public int? PageNumber { get; set; }
    public DateTime CreatedAt { get; set; }
} 

public class ComicBookCreateResponse
{
    public string ComicBookId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AdditionalDetails { get; set; }
    public string GenerationStatus { get; set; } = "Pending";
} 

public class ComicBookGetResponse
{
    public string ComicBookId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AdditionalDetails { get; set; }
    public string? FinalComicBookPath { get; set; }
    public string GenerationStatus { get; set; } = "Pending";
    public bool IsCompleted { get; set; }
    public List<SceneGetResponse> Scenes { get; set; } = new();
} 

public class ComicBookListResponse
{
    public string ComicBookId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AdditionalDetails { get; set; }
    public string? FinalComicBookPath { get; set; }
    public string GenerationStatus { get; set; } = "Pending";
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
} 

public class ComicBookUpdateResponse
{
    public string ComicBookId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AdditionalDetails { get; set; }
    public string? FinalComicBookPath { get; set; }
    public string GenerationStatus { get; set; } = "Pending";
    public bool IsCompleted { get; set; }
} 

public class SceneCreateResponse
{
    public string SceneId { get; set; } = string.Empty;
    public int SceneOrder { get; set; }
    public string? ImagePath { get; set; }
    public string? StyledImagePath { get; set; }
    public string? UserDescription { get; set; }
    public string? DialogueText { get; set; }
    public string? TransitionNotes { get; set; }
} 

public class SceneGetResponse
{
    public string SceneId { get; set; } = string.Empty;
    public int SceneOrder { get; set; }
    public string? ImagePath { get; set; }
    public string? StyledImagePath { get; set; }
    public string? UserDescription { get; set; }
    public string? AiGeneratedStory { get; set; }
    public string? DialogueText { get; set; }
    public string? TransitionNotes { get; set; }
} 

public class SceneUpdateResponse
{
    public string SceneId { get; set; } = string.Empty;
    public int SceneOrder { get; set; }
    public string? ImagePath { get; set; }
    public string? StyledImagePath { get; set; }
    public string? UserDescription { get; set; }
    public string? DialogueText { get; set; }
    public string? TransitionNotes { get; set; }
    public string? AiGeneratedStory { get; set; }
} 

