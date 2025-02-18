using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ComicBookGenerator.Services;
using ComicBookGenerator.Models;

namespace ComicBookGenerator.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComicBookController : ControllerBase
    {
        private readonly IComicBookService _comicBookService;
        private readonly ILogger<ComicBookController> _logger;

        public ComicBookController(IComicBookService comicBookService, ILogger<ComicBookController> logger)
        {
            _comicBookService = comicBookService;
            _logger = logger;
        }

        [HttpPost("create")]
        public async Task<ActionResult<ApiResponse<ComicBookCreateResponse>>> CreateComicBook([FromBody] ComicBookCreateRequest request)
        {
            try
            {
                var response = await _comicBookService.CreateComicBookAsync(request);
                return Ok(ApiResponse<ComicBookCreateResponse>.Success(response));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comic book");
                return StatusCode(500, ApiResponse<ComicBookCreateResponse>.Failure(
                    "An error occurred while creating the comic book",
                    "COMIC_CREATE_ERROR",
                    ex.Message
                ));
            }
        }
    }
} 