import Event from "../models/Event.js";

/**
 * İstifadəçinin bütün event-lərini əldə et
 * GET /api/events
 */
export const getEvents = async (req, res) => {
  try {
    // Token-dan gələn istifadəçi ID-sini istifadə et
    const userId = req.user.id;
    
    const events = await Event.find({ userId })
      .populate("userId", "name email")
      .sort({ date: -1, startTime: -1 }); // Tarixə görə sırala

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('❌ GET EVENTS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Tək event əldə et (ID ilə)
 * GET /api/events/:id
 */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      userId: req.user.id // Yalnız öz event-lərini görə bilər
    }).populate("userId", "name email");
    
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: "Event not found" 
      });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('❌ GET EVENT BY ID Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Yeni event yarat
 * POST /api/events
 */
export const createEvent = async (req, res) => {
  try {
    const { title, description, startTime, endTime, location, date, dayOfWeek, status, note } = req.body;

    // Lazımi sahələri yoxla
    if (!title || !startTime || !endTime || !date) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: title, startTime, endTime, date" 
      });
    }

    const newEvent = new Event({
      userId: req.user.id, // Token-dan gələn ID
      title,
      description,
      startTime,
      endTime,
      location,
      date,
      dayOfWeek,
      status,
      note,
    });

    const savedEvent = await newEvent.save();
    
    res.status(201).json({
      success: true,
      data: savedEvent,
      message: "Event created successfully"
    });
  } catch (error) {
    console.error('❌ CREATE EVENT Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Event yenilə
 * PUT /api/events/:id
 */
export const updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findOneAndUpdate(
      { 
        _id: req.params.id,
        userId: req.user.id // Yalnız öz event-lərini yeniləyə bilər
      },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedEvent) {
      return res.status(404).json({ 
        success: false,
        message: "Event not found or you don't have permission" 
      });
    }
    
    res.json({
      success: true,
      data: updatedEvent,
      message: "Event updated successfully"
    });
  } catch (error) {
    console.error('❌ UPDATE EVENT Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Event sil
 * DELETE /api/events/:id
 */
export const deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id // Yalnız öz event-lərini silə bilər
    });
    
    if (!deletedEvent) {
      return res.status(404).json({ 
        success: false,
        message: "Event not found or you don't have permission" 
      });
    }
    
    res.json({
      success: true,
      message: "Event deleted successfully",
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('❌ DELETE EVENT Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};