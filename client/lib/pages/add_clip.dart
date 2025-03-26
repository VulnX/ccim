import 'dart:math';
import 'package:ccim_client/main.dart';
import 'package:ccim_client/models/paste_data.dart';
import 'package:ccim_client/utils/utils.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:proper_filesize/proper_filesize.dart';

class AddClipsPage extends StatelessWidget {
  const AddClipsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return MyScaffold(body: AddClipsBody(), showFloatingActionButton: false);
  }
}

class AddClipsBody extends StatefulWidget {
  const AddClipsBody({super.key});

  @override
  State<AddClipsBody> createState() => _AddClipsBodyState();
}

class _AddClipsBodyState extends State<AddClipsBody> {
  List<bool> stepsCompleted = [false, false, false];
  final PasteData pasteData = PasteData();
  static const detailsStep = 0;
  static const pasteStep = 1;
  static const encStep = 2;
  int _currentStep = encStep;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [Heading(), generatePasteSteps()],
    );
  }

  Expanded generatePasteSteps() {
    return Expanded(
      child: Stepper(
        controlsBuilder: controlsBuilder,
        currentStep: _currentStep,
        onStepCancel: handleBackButton,
        onStepContinue: handleNextButton,
        onStepTapped: handleStepTap,
        steps: [
          Step(
            title: Text('Details'),
            content: DetailsStep(),
            isActive:
                _currentStep == detailsStep || stepsCompleted[detailsStep],
            state:
                (stepsCompleted[detailsStep])
                    ? StepState.complete
                    : StepState.indexed,
          ),
          Step(
            title: Text('Paste'),
            content: PasteStep(pasteData: pasteData),
            isActive: _currentStep == pasteStep || stepsCompleted[pasteStep],
            state:
                (stepsCompleted[pasteStep])
                    ? StepState.complete
                    : StepState.indexed,
          ),
          Step(
            title: Text('Protections'),
            content: ProtectionsStep(pasteData: pasteData),
            isActive: _currentStep == encStep || stepsCompleted[encStep],
            state:
                (stepsCompleted[encStep])
                    ? StepState.complete
                    : StepState.indexed,
          ),
        ],
      ),
    );
  }

  void handleStepTap(int index) {
    setState(() {
      _currentStep = index;
    });
  }

  void handleBackButton() {
    if (_currentStep > detailsStep) {
      setState(() {
        _currentStep -= 1;
      });
    }
  }

  void handleNextButton() {
    if (_currentStep == detailsStep) {
      // TODO : Validate by communicating with backend
    } else if (_currentStep == pasteStep) {
      try {
        pasteData.textData.validate();
        // file(s) are auto validated on selection so no explicit checking
      } catch (e) {
        if (context.mounted) {
          if (e is MaxMessageLengthExceededException) {
            showOkDialog(context, e.title, e.description);
          } else {
            showOkDialog(context, 'Error', e.toString());
          }
        }
        return;
      }
    } else if (_currentStep == encStep) {
      if (pasteData.encData.useEncryption) {
        try {
          pasteData.encData.validate();
        } catch (e) {
          if (context.mounted) {
            if (e is EmptyEncPasswordException) {
              showOkDialog(context, e.title, e.description);
            } else if (e is PasswordTooLongException) {
              showOkDialog(context, e.title, e.description);
            } else {
              showOkDialog(context, 'Error', e.toString());
            }
          }
          return;
        }
      }

      // Ensure all steps are validated
      if (stepsCompleted.any((completed) => !completed)) {
        if (context.mounted) {
          showOkDialog(
            context,
            'Incomplete',
            'Please ensure all previous steps are validated before submitting',
          );
        }
      }
    }

    setState(() {
      stepsCompleted[_currentStep] = true;
      if (_currentStep <= pasteStep) {
        _currentStep += 1;
      }
    });
  }

  Widget controlsBuilder(context, currentStep) {
    return Row(
      spacing: 20,
      children: [
        TextButton(
          onPressed: currentStep.onStepContinue,
          style: TextButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(3),
            ),
            foregroundColor: Colors.white,
            backgroundColor: Theme.of(context).primaryColor,
          ),
          child: Text((_currentStep != encStep) ? 'Next' : 'Publish'),
        ),
        if (_currentStep != detailsStep)
          TextButton(
            onPressed: currentStep.onStepCancel,
            style: TextButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(3),
              ),
              foregroundColor: Colors.black,
              // overlayColor: Colors.transparent,
            ),
            child: const Text('Back'),
          ),
      ],
    );
  }
}

class Heading extends StatelessWidget {
  const Heading({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(32),
          child: Title(
            color: Colors.black,
            child: Text(
              'Create your clipboard',
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }
}

class DetailsStep extends StatelessWidget {
  DetailsStep({super.key});

  final List<String> animals = [
    'lion',
    'tiger',
    'elephant',
    'zebra',
    'giraffe',
    'panda',
    'koala',
    'kangaroo',
    'wolf',
    'shark',
  ];

  final List<String> colors = [
    'red',
    'blue',
    'green',
    'yellow',
    'black',
    'white',
    'purple',
    'orange',
    'brown',
    'pink',
  ];

  final List<String> elements = [
    'hydrogen',
    'oxygen',
    'nitrogen',
    'carbon',
    'helium',
    'neon',
    'sodium',
    'iron',
    'gold',
    'silver',
  ];

  String getRandomName() {
    final Random random = Random();
    String randomAnimal = animals[random.nextInt(animals.length)];
    String randomColor = colors[random.nextInt(colors.length)];
    String randomElement = elements[random.nextInt(elements.length)];
    return '$randomColor-$randomElement-$randomAnimal';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: TextFormField(
        initialValue: getRandomName(),
        decoration: InputDecoration(
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.grey.shade600),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.grey.shade600),
          ),
          labelText: 'NAME',
          floatingLabelStyle: TextStyle(color: Colors.grey.shade600),
        ),
      ),
    );
  }
}

class PasteStep extends StatefulWidget {
  const PasteStep({super.key, required this.pasteData});

  final PasteData pasteData;

  @override
  State<PasteStep> createState() => _PasteStepState();
}

class _PasteStepState extends State<PasteStep> with TickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: [Tab(text: "Text"), Tab(text: "File")],
        ),
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.4,
          child: TabBarView(
            controller: _tabController,
            children: [
              TextSection(pasteData: widget.pasteData),
              FileSection(pasteData: widget.pasteData),
            ],
          ),
        ),
      ],
    );
  }
}

class FileSection extends StatefulWidget {
  const FileSection({super.key, required this.pasteData});

  final PasteData pasteData;

  @override
  State<FileSection> createState() => _FileSectionState();
}

class _FileSectionState extends State<FileSection> {
  bool _filePickerActive = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Center(
            child: FilledButton.icon(
              icon: Icon(Icons.upload),
              onPressed: () => handleFilePicker(context),
              label: Text("Select file"),
              style: ElevatedButton.styleFrom(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(3),
                ),
                backgroundColor:
                    _filePickerActive
                        ? Colors.blue.shade900
                        : Theme.of(context).primaryColor,
              ),
            ),
          ),
          if (_filePickerActive)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: LinearProgressIndicator(),
            ),
          if (widget.pasteData.filesData.files != null)
            SelectedFiles(widget: widget),
        ],
      ),
    );
  }

  void handleFilePicker(BuildContext context) async {
    if (_filePickerActive) {
      return;
    }
    setState(() {
      _filePickerActive = true;
    });
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
    );
    setState(() {
      _filePickerActive = false;
    });

    if (result == null) {
      if (context.mounted) {
        showOkDialog(
          context,
          'No file selected',
          'Please select one/more files to send',
        );
        widget.pasteData.filesData.clearFiles();
      }
      return;
    }

    try {
      setState(() {
        widget.pasteData.filesData.setFiles(result.files);
      });
    } catch (e) {
      if (context.mounted) {
        if (e is MaxTotalFileSizeExceededException) {
          showOkDialog(context, e.title, e.description);
        } else {
          showOkDialog(context, 'Error', e.toString());
        }
      }
      return;
    }
  }
}

class SelectedFiles extends StatelessWidget {
  const SelectedFiles({super.key, required this.widget});

  final FileSection widget;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: ListView.builder(
        padding: EdgeInsets.all(8),
        itemCount: widget.pasteData.filesData.files!.length,
        itemBuilder: (context, index) {
          return Card.outlined(
            margin: EdgeInsets.symmetric(vertical: 8),
            child: ListTile(
              title: Text(widget.pasteData.filesData.files![index].name),
              subtitle: Row(
                children: [
                  Chip(
                    label: Text(
                      FileSize.fromBytes(
                        widget.pasteData.filesData.files![index].size,
                      ).toString(decimals: 2),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class TextSection extends StatelessWidget {
  const TextSection({super.key, required this.pasteData});

  final PasteData pasteData;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Card(
        color: Colors.white70,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 15),
          child: TextField(
            controller: pasteData.textData.controller,
            minLines: 5,
            maxLines: 10,
            decoration: InputDecoration(
              border: InputBorder.none,
              hintText: 'Paste message here...',
            ),
            style: TextStyle(
              fontFamily: 'FiraCode',
              fontWeight: FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}

class ProtectionsStep extends StatefulWidget {
  const ProtectionsStep({super.key, required this.pasteData});

  final PasteData pasteData;

  @override
  State<ProtectionsStep> createState() => _ProtectionsStepState();
}

class _ProtectionsStepState extends State<ProtectionsStep> {
  static const WidgetStateProperty<Icon> thumbIcon =
      WidgetStateProperty<Icon>.fromMap(<WidgetStatesConstraint, Icon>{
        WidgetState.selected: Icon(Icons.check),
        WidgetState.any: Icon(Icons.close),
      });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 20),
      child: Column(
        children: [
          ListTile(
            leading: Icon(Icons.security),
            title: Text('Enable end-to-end encryption'),
            trailing: Switch(
              value: widget.pasteData.encData.useEncryption,
              onChanged: (bool choice) {
                setState(() {
                  widget.pasteData.encData.useEncryption = choice;
                });
              },
              thumbIcon: thumbIcon,
            ),
          ),
          if (widget.pasteData.encData.useEncryption)
            Card(
              color: Colors.white,
              margin: EdgeInsets.all(16),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: TextField(
                  controller: widget.pasteData.encData.controller,
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: 'Password to encrypt clipboard...',
                    border: InputBorder.none,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
